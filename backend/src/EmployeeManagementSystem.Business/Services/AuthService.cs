using EmployeeManagementSystem.Business.DTOs.Auth;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.DataAccess.Entities.Enums;
using EmployeeManagementSystem.DataAccess.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace EmployeeManagementSystem.Business.Services
{
    public class AuthService : IAuthService
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IPasswordService _passwordHasher;
        private readonly IJwtService _jwtService;
        private readonly IRefreshTokenGraceCache _graceCache;
        private readonly ILogger<AuthService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IWebHostEnvironment _env;

        public AuthService(
            IEmployeeRepository employeeRepository,
            IPasswordService passwordHasher,
            IJwtService jwtService,
            IRefreshTokenGraceCache cache,
            ILogger<AuthService> logger,
            IHttpContextAccessor httpContextAccessor,
            IWebHostEnvironment env)
        {
            _employeeRepository = employeeRepository;
            _passwordHasher = passwordHasher;
            _jwtService = jwtService;
            _graceCache = cache;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _env = env;
        }

        private void SetRefreshTokenCookie(string refreshToken, DateTime expiresAt, bool rememberMe)
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return;

            var isDev = _env.IsDevelopment();
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = !isDev,
                SameSite = isDev ? SameSiteMode.Lax : SameSiteMode.None,
                IsEssential = true,
                Expires = rememberMe? expiresAt : null
            };

            httpContext.Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
        }

        private void ClearRefreshTokenCookie()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return;

            var isDev = _env.IsDevelopment();
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = !isDev,
                SameSite = isDev ? SameSiteMode.Lax : SameSiteMode.None,
                IsEssential = true,
                Expires = DateTimeOffset.UtcNow.AddDays(-1)
            };

            httpContext.Response.Cookies.Delete("refreshToken", cookieOptions);
        }


        //login
        public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
        {
            _logger.LogInformation("Login attempt for {Email}", request.Email);

            var employee = await _employeeRepository.GetByEmailAsync(request.Email);

            // User not found
            if (employee == null)
            {
                _logger.LogWarning(
                    "Login failed. Employee not found for {Email}",
                     request.Email);
                return new LoginResponseDto
                {
                    Success = false,
                    Message = "Invalid email or password.",
                    MustChangePassword = false
                };
            }

            // Verify password
            bool isPasswordValid = _passwordHasher.VerifyPassword(
                request.Password,
                employee.PasswordHash);

            if (!isPasswordValid)
            {
                _logger.LogWarning("Invalid password for {Email}", request.Email);
                return new LoginResponseDto
                {
                    Success = false,
                    Message = "Invalid email or password.",
                    MustChangePassword = false
                };
            }

            // Check if account is deleted
            if (employee.Status == EmployeeStatus.Deleted)
            {
                _logger.LogWarning("Deleted employee attempted login. EmployeeCode: {EmployeeCode}", employee.EmployeeCode);
                return new LoginResponseDto
                {
                    Success = false,
                    Message = "This account has been deleted.",
                    MustChangePassword = false
                };
            }

            // Check if account is inactive
            if (employee.Status == EmployeeStatus.Inactive)
            {
                _logger.LogWarning("Inactive employee attempted login. EmployeeCode: {EmployeeCode}", employee.EmployeeCode);
                return new LoginResponseDto
                {
                    Success = false,
                    Message = "This account is disabled.",
                    MustChangePassword = false
                };
            }

            //successful login
            _logger.LogInformation("Employee {EmployeeCode} logged in successfully", employee.EmployeeCode);

            // Revoke all previous refresh tokens
            _logger.LogInformation("Revoking previous refresh tokens for {EmployeeCode}", employee.EmployeeCode);
            employee.TokenVersion++;
            await _employeeRepository.UpdateAsync(employee);

            // Login successful
            var tokens = _jwtService.GenerateTokenPair(employee, request.RememberMe);

            SetRefreshTokenCookie(tokens.RefreshToken, tokens.RefreshTokenExpiresAt, request.RememberMe);

            return new LoginResponseDto
            {
                Success = true,
                Message = "Login successful.",
                MustChangePassword = employee.MustChangePassword,
                AccessToken = tokens.AccessToken,
                ExpiresAt = tokens.AccessTokenExpiresAt
            };
        }

        //refresh access token
        private static readonly SemaphoreSlim _refreshLock = new(1, 1);

        //refresh access token
        public async Task<LoginResponseDto> RefreshTokenAsync()
        {
            _logger.LogInformation("Refresh token request received.");

            var refreshToken = _httpContextAccessor.HttpContext?.Request.Cookies["refreshToken"];

            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                return new LoginResponseDto
                {
                    Success = false,
                    Message = "Refresh token is missing."
                };
            }

            //checking if there were already accesstoken-refresh token generated in 5 
            //(checking in memory cache.)
            var cached = _graceCache.Get(refreshToken);

            if (cached != null)
            {
                _logger.LogInformation("Refresh token served from grace cache.");
                return cached;
            }

            // Serialize concurrent refresh attempts so only one request actually
            // rotates the token; everyone else waits and reads the grace cache.
            await _refreshLock.WaitAsync();
            try
            {
                // Re-check the grace cache now that we hold the lock — another
                // request may have just finished processing this exact token.
                cached = _graceCache.Get(refreshToken);
                if (cached != null)
                {
                    _logger.LogInformation("Refresh token served from grace cache after lock wait.");
                    return cached;
                }

                ClaimsPrincipal? principal;

                try
                {
                    //taking the pricipal from the token passed
                    principal = _jwtService.GetPrincipalFromToken(refreshToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(
                    ex,
                    "Invalid refresh token received.");

                    ClearRefreshTokenCookie();

                    return new LoginResponseDto
                    {
                        Success = false,
                        Message = "Invalid refresh token."
                    };
                }

                if (principal == null)
                {
                    ClearRefreshTokenCookie();

                    return new LoginResponseDto
                    {
                        Success = false,
                        Message = "Invalid refresh token."
                    };
                }

                var tokenType = principal.FindFirst("TokenType")?.Value;

                if (tokenType != "Refresh")
                {
                    _logger.LogWarning("Refresh failed because token type was invalid.");
                    ClearRefreshTokenCookie();
                    return new LoginResponseDto
                    {
                        Success = false,
                        Message = "Invalid token type."
                    };
                }

                var employeeCode = principal.FindFirst("EmployeeCode")?.Value;

                if (string.IsNullOrWhiteSpace(employeeCode))
                {
                    _logger.LogWarning("Refresh failed because EmployeeCode claim was missing.");
                    ClearRefreshTokenCookie();
                    return new LoginResponseDto
                    {
                        Success = false,
                        Message = "Invalid refresh token."
                    };
                }

                var employee = await _employeeRepository.GetByEmployeeCodeAsync(employeeCode);

                if (employee == null)
                {
                    ClearRefreshTokenCookie();
                    return new LoginResponseDto
                    {
                        Success = false,
                        Message = "User not found."
                    };
                }

                if (employee.Status != EmployeeStatus.Active)
                {
                    _logger.LogWarning("Refresh denied for inactive employee {EmployeeCode}.", employee.EmployeeCode);
                    ClearRefreshTokenCookie();
                    return new LoginResponseDto
                    {
                        Success = false,
                        Message = "User account is not active."
                    };
                }

                //taking the tokenversion from the refreshtoken
                var tokenVersionClaim = principal.FindFirst("TokenVersion")?.Value;
                if (!int.TryParse(tokenVersionClaim, out var tokenVersion))
                {
                    ClearRefreshTokenCookie();
                    return new LoginResponseDto { Success = false, Message = "Invalid refresh token." };
                }

                //checking if the tokenversion in refresh token is matching the one in the db
                if (tokenVersion != employee.TokenVersion)
                {
                    _logger.LogWarning("Refresh token revoked for {EmployeeCode}.", employee.EmployeeCode);
                    ClearRefreshTokenCookie();
                    return new LoginResponseDto
                    {
                        Success = false,
                        Message = "Refresh token has been revoked."
                    };
                }

                var shouldRotate = _jwtService.ShouldRotateRefreshToken(refreshToken);

                LoginResponseDto response;

                if (shouldRotate)
                {
                    _logger.LogInformation("Refresh token rotated for {EmployeeCode}.", employee.EmployeeCode);
                    employee.TokenVersion++;

                    await _employeeRepository.UpdateAsync(employee);

                    var isRememberMe = bool.TryParse(principal.FindFirst("RememberMe")?.Value, out var rm) && rm;

                    var tokens = _jwtService.GenerateTokenPair(employee, isRememberMe);

                    SetRefreshTokenCookie(tokens.RefreshToken, tokens.RefreshTokenExpiresAt, isRememberMe);

                    response = new LoginResponseDto
                    {
                        Success = true,
                        Message = "Token refreshed successfully.",
                        AccessToken = tokens.AccessToken,
                        ExpiresAt = tokens.AccessTokenExpiresAt
                    };
                }
                else
                {
                    _logger.LogInformation("Access token regenerated for {EmployeeCode}.", employee.EmployeeCode);
                    var tokens = _jwtService.GenerateAccessTokenOnly(employee);

                    response = new LoginResponseDto
                    {
                        Success = true,
                        Message = "Token refreshed successfully.",
                        AccessToken = tokens.AccessToken,
                        ExpiresAt = tokens.AccessTokenExpiresAt
                    };
                }

                //storing the tokens in cache to tackle the network race conditions
                _graceCache.Set(
                    refreshToken,
                    response,
                    TimeSpan.FromSeconds(5));
                _logger.LogDebug("Refresh response cached for grace period.");
                return response;
            }
            finally
            {
                _refreshLock.Release();
            }
        }

        //login
        public async Task LogoutAsync()
        {
            var refreshToken = _httpContextAccessor.HttpContext?.Request.Cookies["refreshToken"];

            if (!string.IsNullOrWhiteSpace(refreshToken))
            {
                try
                {
                    var principal = _jwtService.GetPrincipalFromToken(refreshToken);
                    if (principal != null)
                    {
                        var employeeCode = principal.FindFirst("EmployeeCode")?.Value;
                        if (!string.IsNullOrWhiteSpace(employeeCode))
                        {
                            var employee = await _employeeRepository.GetByEmployeeCodeAsync(employeeCode);
                            if (employee != null)
                            {
                                _logger.LogInformation("Logout invalidating refresh session for {EmployeeCode}", employee.EmployeeCode);
                                employee.TokenVersion++;
                                await _employeeRepository.UpdateAsync(employee);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Logout encountered invalid refresh token during session invalidation.");
                }
            }

            ClearRefreshTokenCookie();
        }
    }
}

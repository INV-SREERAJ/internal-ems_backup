using EmployeeManagementSystem.Business.DTOs.Auth;
using EmployeeManagementSystem.Business.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace EmployeeManagementSystem.Business.Services
{
    public class RefreshTokenGraceCache : IRefreshTokenGraceCache
    {
        private readonly IMemoryCache _cache;

        public RefreshTokenGraceCache(IMemoryCache cache)
        {
            _cache = cache;
        }

        public LoginResponseDto? Get(string refreshToken)
        {
            _cache.TryGetValue(refreshToken, out LoginResponseDto? response);

            return response;
        }

        public void Set(
            string refreshToken,
            LoginResponseDto response,
            TimeSpan duration)
        {
            _cache.Set(refreshToken, response, duration);
        }
    }
}
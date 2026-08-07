namespace EmployeeManagementSystem.Business.DTOs.Auth
{
    public class ResetPasswordRequestDto
    {
        public string Token { get; set; }
        public string NewPassWord { get; set; }
        public string ConfirmPassword { get; set; }
    }
}

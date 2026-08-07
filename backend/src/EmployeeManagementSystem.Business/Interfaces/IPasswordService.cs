namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface IPasswordService
    {
        string HashPassword(string password);

        bool VerifyPassword(string password, string passwordHash);

        string GenerateTemporaryPassword(int length = 10);
    }
}

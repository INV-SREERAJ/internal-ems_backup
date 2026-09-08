using EmployeeManagementSystem.Business.Interfaces;

namespace EmployeeManagementSystem.Business.Services
{
    public class PasswordService : IPasswordService
    {
        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public bool VerifyPassword(string password, string passwordHash)
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }


        // temp password
        public string GenerateTemporaryPassword(int length = 10)
        {
            const string upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const string lower = "abcdefghijklmnopqrstuvwxyz";
            const string numbers = "0123456789";
            const string special = "@#$%&*!";

            var allChars = upper + lower + numbers + special;
            var random = new Random();

            var password = new List<char>
            {
                upper[random.Next(upper.Length)],
                lower[random.Next(lower.Length)],
                numbers[random.Next(numbers.Length)],
                special[random.Next(special.Length)]
            };

            while (password.Count < length)
            {
                password.Add(allChars[random.Next(allChars.Length)]);
            }

            return new string(password.OrderBy(_ => random.Next()).ToArray());
        }
    }
}

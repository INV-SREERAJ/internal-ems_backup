namespace EmployeeManagementSystem.Business.Common
{
    public static class WorkingDayCalculator
    {
        public static int Count(DateOnly from, DateOnly to)
        {
            if (from > to)
            {
                return 0;
            }

            int count = 0;
            for (var current = from; current <= to; current = current.AddDays(1))
            {
                if (current.DayOfWeek != DayOfWeek.Saturday && current.DayOfWeek != DayOfWeek.Sunday)
                {
                    count++;
                }
            }

            return count;
        }
    }
}

/**
 * Error Utils
 * Parses ASP.NET Core ValidationProblemDetails and API error responses into clean human-readable text.
 */
export function formatErrorMessage(err, defaultMsg = "An error occurred.") {
    if (!err || !err.response) {
        return err?.message || defaultMsg;
    }

    const data = err.response.data;
    if (!data) {
        return defaultMsg;
    }

    // Handle ASP.NET Core ValidationProblemDetails (errors dictionary)
    if (data.errors && typeof data.errors === "object") {
        const errorList = [];
        Object.keys(data.errors).forEach((key) => {
            const val = data.errors[key];
            if (Array.isArray(val)) {
                errorList.push(...val);
            } else if (typeof val === "string") {
                errorList.push(val);
            }
        });
        if (errorList.length > 0) {
            return errorList.join(" ");
        }
    }

    if (typeof data.message === "string" && data.message) return data.message;
    if (typeof data.Message === "string" && data.Message) return data.Message;
    if (typeof data.title === "string" && data.title) return data.title;
    if (typeof data.Title === "string" && data.Title) return data.Title;
    if (typeof data === "string" && data) return data;

    return defaultMsg;
}

// This is a custom APIError class that extends Error class

class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong", //Default Message
        stack,
        errors = []
    ) {
        super(message); // Calls the parent Error class constructor with this message
        this.statusCode = statusCode; // Stores the HTTP Status Codes (e.g 200, 400, 500 etc.)
        (this.errors = errors), // Stores the array of additional error details
            (this.data = null), // Placeholder for any data (additional context about the error in the form of object)
            (this.success = false), // Indicates Failure (important for API Response)
            (this.message = message); // Explicitly sets the message

        if (stack) {
            this.stack = stack; //If stack is available in parameter, set it explicitly
        } else {
            Error.captureStackTrace(this, this.constructor); // Else remove this constructor from Stack Trace to improve Error readability
        }
    }
}

export { ApiError };

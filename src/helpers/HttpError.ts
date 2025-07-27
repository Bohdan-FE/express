const httpErrorStatuses = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    500: 'Internal Server Error',
};

type HttpStatus = 400 | 401 | 403 | 404 | 409| 500;

interface HttpError extends Error {
    status: HttpStatus;
}

const HttpError = (status: HttpStatus, message: string = httpErrorStatuses[status]): HttpError => {
    const error = new Error(message) as HttpError;
    error.status = status;
    return error;
}

export default HttpError
const resModule = {
    successTrue: (code, message, data) => {
        return {
            result: data,
            isSuccess: true,
            code : code,
            message: message
        }
    },
    successFalse: (code, message) => {
        return {
            isSuccess: false,
            code : code,
            message: message
        }
    },
};

module.exports = resModule;
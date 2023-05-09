const loginValidation = {
        email: {
            trim: true,
            notEmpty: {
                errorMessage: "An email is required"
            },
            isEmail: {
                errorMessage: "Must be a valid email"
            }
        },
    password: {
        trim: true,
        notEmpty: {
            errorMessage: "A password is required"
        },
        isString: true,
        }
}

const registerValidation = {
    email: {
        trim: true,
        notEmpty: {
            errorMessage: "An email is required"
        },
        isEmail: {
            errorMessage: "Must be a valid email"
        }
    },
    password: {
        trim: true,
        notEmpty: {
            errorMessage: "A password is required"
        },
        isString: true,
        isLength: {
            errorMessage: "Password must be minimum 6 characters",
            options: {
                min: 6,
            }
        }
    },
    username: {
        trim: true,
        notEmpty: {
            errorMessage: "A username is required"
        },
        isString: true,
        isLength: {
            errorMessage: "Username must be minimum 2 characters",
            options: {
                min: 2,
            }
        }
    },
}

const searchValidation = {
    searchWord: {
        notEmpty: {
            errorMessage: "A search word is required"
        },
        isString: true,
    },
    page: {
        notEmpty: {
            errorMessage: "A page number is required"
        },
        isString: true,
        isNumeric: true,
    }
}

const messageValidation = {
    chatID: {
        trim: true,
        notEmpty: true,
        isInt: true,
    },
    text: {
        notEmpty: true,
        isString: true,
    }
}

const readNotificationValidation = {
    notificID: {
        trim: true,
        notEmpty: true,
        isInt: true,
    },
    isRead: {
        notEmpty: true,
        isBoolean: true,
    }
}

module.exports = {loginValidation, registerValidation, searchValidation, messageValidation, readNotificationValidation};

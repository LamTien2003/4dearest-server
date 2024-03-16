const dayjs = require('dayjs');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendOtp } = require('../utils/email');
const { sendResponseToClient } = require('../utils/utils');

const User = require('../model/userModel');

const generateToken = (data, secretKey, expiredTime) => {
    const token = jwt.sign(data, secretKey, {
        expiresIn: expiredTime,
    });
    return token;
};
const createAndSendToken = async (user, statusCode, res) => {
    if (user.password) user.password = undefined;
    if (user.refreshToken) user.refreshToken = undefined;

    const accessToken = generateToken(
        { id: user._id, role: user.role },
        process.env.JWT_ACCESS_KEY,
        process.env.JWT_EXPIRES_IN_ACCESS,
    );
    const refreshToken = generateToken(
        { id: user._id, role: user.role },
        process.env.JWT_REFRESH_KEY,
        process.env.JWT_EXPIRES_IN_REFRESH,
    );

    await User.findByIdAndUpdate(user._id, { refreshToken });

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
        // expires: new Date(Date.now() + 1 * 60 * 1000),
        httpOnly: true,
    };

    //   if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', refreshToken, cookieOptions);
    return sendResponseToClient(res, statusCode, {
        status: 'success',
        data: user,
        accessToken,
    });
};

exports.signUp = catchAsync(async (req, res, next) => {
    const { name, email, password, passwordConfirm } = req.body;
    let payload = {
        name,
        email,
        password,
        passwordConfirm,
    };
    if (req?.file?.filename) {
        payload.photo = req.file.filename;
    }

    const newUser = await User.create({ ...payload });
    return createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError('Please provide complete information'), 400);
    }
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(user.password, password))) {
        return next(new AppError('Account or password is incorrect'), 401);
    }

    createAndSendToken(user, 200, res);
});

exports.refreshToken = catchAsync(async (req, res, next) => {
    const { jwt: token } = req.cookies;

    if (!token) {
        return next(new AppError('Không có token được đính kèm'), 403);
    }
    const tokenDecoded = await promisify(jwt.verify)(token, process.env.JWT_REFRESH_KEY);
    if (!token || !tokenDecoded) {
        return next(new AppError('Token không hợp lệ', 401));
    }

    const user = await User.findOne({ _id: tokenDecoded.id }).select('+refreshToken');

    if (!user) {
        return next(new AppError('Người dùng này hiện không còn tồn tại', 401));
    }
    if (token !== user.refreshToken) {
        return next(new AppError('Token không hợp lệ, có thể người dùng đã được đăng nhập từ thiết bị khác', 401));
    }

    return createAndSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return next(new AppError('Người dùng này hiện không còn tồn tại', 401));
    }
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.clearCookie('jwt');

    return sendResponseToClient(res, 200, {
        status: 'success',
        msg: 'Đăng xuất thành công !!! ',
    });
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
    const { currentPassword, password, passwordConfirm } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.correctPassword(user.password, currentPassword))) {
        return next(new AppError('Mật khẩu sai !!!', 401));
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    await user.save();

    createAndSendToken(user, 200, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError('Email không đúng hoặc không tồn tại', 400));
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    user.otpExpires = dayjs().add(5, 'minute').toISOString();
    await user.save({ validateBeforeSave: false });
    await sendOtp({
        subject: 'Yêu cầu khôi phục mật khẩu',
        to: email,
        otp,
    });
    return sendResponseToClient(res, 200, {
        status: 'success',
        msg: 'Đã gửi mã OTP đến địa chỉ gmail !!! ',
    });
});

exports.confirmOtp = catchAsync(async (req, res, next) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError('Email không đúng hoặc không tồn tại', 400));
    }
    if (user.otp !== otp) {
        return next(new AppError('Mã xác nhận không chính xác', 400));
    }
    if (dayjs(user.otpExpires) < dayjs()) {
        return next(new AppError('Mã xác nhận đã hết hạn, vui lòng thử lại để nhận mã xác nhận mới', 400));
    }
    return sendResponseToClient(res, 200, {
        status: 'success',
        msg: 'Mã xác nhận chính xác !!! ',
    });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    const { email, otp, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError('Email không đúng hoặc không tồn tại', 400));
    }
    if (user.otp !== otp) {
        return next(new AppError('Mã xác nhận không chính xác', 400));
    }
    if (dayjs(user.otpExpires) < dayjs()) {
        return next(new AppError('Mã xác nhận đã hết hạn, vui lòng thử lại để nhận mã xác nhận mới', 400));
    }

    user.password = password;
    await user.save({ validateBeforeSave: false });

    return sendResponseToClient(res, 200, {
        status: 'success',
        msg: 'Thay đổi mật khẩu thành công ',
    });
});

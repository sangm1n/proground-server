convertJson = function (res, result, isSuccess, code, message) {
    if (!result) {
        return res.json({
            isSuccess: isSuccess,
            code: code,
            message: message
        })
    } else {
        return res.json({
            result: result,
            isSuccess: isSuccess,
            code: code,
            message: message
        });
    }
}

exports.status = function (res, result, status) {
    switch (status) {
        // 1000 : 요청 성공
        case "SUCCESS":
            return convertJson(res, result, true, 1000, "요청에 성공하였습니다.");
        case "SUCCESS_READ_USERS":
            return convertJson(res, result, true, 1010, "회원 전체 정보 조회에 성공하였습니다.");
        case "SUCCESS_READ_USER":
            return convertJson(res, result, true, 1011, "회원 정보 조회에 성공하였습니다.");
        case "SUCCESS_POST_USER":
            return convertJson(res, result, true, 1012, "회원가입에 성공하였습니다.");
        case "SUCCESS_LOGIN":
            return convertJson(res, result, true, 1013, "로그인에 성공하였습니다.");
        case "SUCCESS_JWT":
            return convertJson(res, result, true, 1014, "JWT 검증에 성공하였습니다.");
        case "SUCCESS_DELETE_USER":
            return convertJson(res, result, true, 1015, "회원 탈퇴에 성공하였습니다.");
        case "SUCCESS_PATCH_USER":
            return convertJson(res, result, true, 1016, "회원정보 수정에 성공하였습니다.");

        // 2000 : 요청 오류
        case "REQUEST_ERROR":
            return convertJson(res, result, false, 2000, "입력값을 확인해주세요.");
        case "EMPTY_USERID":
            return convertJson(res, result, false, 2001, "유저 아이디 값을 확인해주세요.");
        case "EMPTY_JWT":
            return convertJson(res, result, false, 2010, "JWT를 입력해주세요.");
        case "INVALID_JWT":
            return convertJson(res, result, false, 2011, "유효하지 않은 JWT입니다.");
        case "EMPTY_EMAIL":
            return convertJson(res, result, false, 2020, "이메일을 입력해주세요.");
        case "INVALID_EMAIL":
            return convertJson(res, result, false, 2021, "이메일 형식을 확인해주세요.");
        case "EMPTY_PASSWORD":
            return convertJson(res, result, false, 2030, "비밀번호를 입력해주세요.");
        case "EMPTY_CONFIRM_PASSWORD":
            return convertJson(res, result, false, 2031, "비밀번호 확인을 입력해주세요.");
        case "WRONG_PASSWORD":
            return convertJson(res, result, false, 2032, "비밀번호를 다시 입력해주세요.");
        case "DO_NOT_MATCH_PASSWORD":
            return convertJson(res, result, false, 2033, "비밀번호와 비밀번호확인 값이 일치하지 않습니다.");
        case "EMPTY_NICKNAME":
            return convertJson(res, result, false, 2040, "닉네임을 입력해주세요.");

        // 3000 : 응답 오류
        case "RESPONSE_ERROR":
            return convertJson(res, result, false, 3000, "값을 불러오는데 실패하였습니다.");
        case "NOT_FOUND_USER":
            return convertJson(res, result, false, 3010, "존재하지 않는 회원입니다.");
        case "DUPLICATED_USER":
            return convertJson(res, result, false, 3011, "이미 존재하는 회원입니다.");
        case "FAILED_TO_GET_USER":
            return convertJson(res, result, false, 3012, "회원 정보 조회에 실패하였습니다.");
        case "FAILED_TO_POST_USER":
            return convertJson(res, result, false, 3013, "회원가입에 실패하였습니다.");
        case "FAILED_TO_LOGIN":
            return convertJson(res, result, false, 3014, "로그인에 실패하였습니다.");
        case "FAILED_TO_DELETE_USER":
            return convertJson(res, result, false, 3015, "회원 탈퇴에 실패하였습니다.");
        case "FAILED_TO_PATCH_USER":
            return convertJson(res, result, false, 3016, "개인정보 수정에 실패하였습니다.");

        // 4000 : 데이터베이스 오류
        case "SERVER_ERROR":
            return convertJson(res, result, false, 4000, "서버와의 통신에 실패하였습니다.");
        case "DATABASE_ERROR":
            return convertJson(res, result, false, 4001, "데이터베이스 연결에 실패하였습니다.");
    }
}

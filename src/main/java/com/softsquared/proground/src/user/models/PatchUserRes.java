package com.softsquared.proground.src.user.models;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PatchUserRes {
    private final String email;
    private final String nickname;
    private final String phoneNumber;
}

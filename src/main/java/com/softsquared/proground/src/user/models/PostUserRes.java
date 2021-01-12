package com.softsquared.proground.src.user.models;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PostUserRes {
    private final int userId;
    private final String jwt;
}

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reset Password</title>
    <style>
        body { font-family: system-ui, Arial, sans-serif; margin: 24px; }
        .card { max-width: 420px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 12px; }
        .row { margin-bottom: 12px; }
        label { display: block; font-weight: 600; margin-bottom: 6px; }
        input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px; }
        button { width: 100%; padding: 12px; background: #4CA474; color: #fff; border: 0; border-radius: 12px; font-weight: 700; }
        .error { color: #c00; margin-bottom: 12px; }
        .password-wrapper { position: relative; }
        .password-wrapper input { padding-right: 44px; }
        .toggle-eye { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; border-radius: 9999px; border: none; background: transparent; display: flex; align-items: center; justify-content: center; padding: 0; cursor: pointer; }
        .toggle-eye svg { width: 18px; height: 18px; color: #4CA474; }
        .eye-off { display: none; }
    </style>
    </head>
<body>
    <div class="card">
        <h2>Reset Password</h2>
        @if ($errors->any())
            <div class="error">{{ $errors->first() }}</div>
        @endif
        <form method="POST" action="/validator/reset-password">
            @csrf
            <input type="hidden" name="token" value="{{ $token }}">
            <div class="row">
                <label>New Password</label>
                <div class="password-wrapper">
                    <input id="password" type="password" name="password" required minlength="8" autocomplete="new-password">
                    <button type="button" class="toggle-eye" data-target="password" aria-label="Toggle password visibility">
                        <svg class="eye-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        <svg class="eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-7-11-7a18.37 18.37 0 0 1 5.06-5.94"/>
                            <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="row">
                <label>Confirm New Password</label>
                <div class="password-wrapper">
                    <input id="password_confirmation" type="password" name="password_confirmation" required minlength="8" autocomplete="new-password">
                    <button type="button" class="toggle-eye" data-target="password_confirmation" aria-label="Toggle password visibility">
                        <svg class="eye-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        <svg class="eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-7-11-7a18.37 18.37 0 0 1 5.06-5.94"/>
                            <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                    </button>
                </div>
            </div>
            <button type="submit">Update Password</button>
        </form>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            var buttons = document.querySelectorAll('.toggle-eye');
            Array.prototype.forEach.call(buttons, function (btn) {
                btn.addEventListener('click', function () {
                    var targetId = btn.getAttribute('data-target');
                    var input = document.getElementById(targetId);
                    if (!input) return;
                    var isPassword = input.getAttribute('type') === 'password';
                    input.setAttribute('type', isPassword ? 'text' : 'password');
                    var onIcon = btn.querySelector('.eye-on');
                    var offIcon = btn.querySelector('.eye-off');
                    if (onIcon && offIcon) {
                        if (isPassword) {
                            onIcon.style.display = 'none';
                            offIcon.style.display = 'block';
                        } else {
                            onIcon.style.display = 'block';
                            offIcon.style.display = 'none';
                        }
                    }
                });
            });
        });
    </script>
</body>
</html>

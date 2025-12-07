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
                <input type="password" name="password" required minlength="8">
            </div>
            <div class="row">
                <label>Confirm New Password</label>
                <input type="password" name="password_confirmation" required minlength="8">
            </div>
            <button type="submit">Update Password</button>
        </form>
    </div>
</body>
</html>

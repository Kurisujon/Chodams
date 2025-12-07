<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ValidatorResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $token;
    public string $email;

    public function __construct(string $email, string $token)
    {
        $this->email = $email;
        $this->token = $token;
    }

    public function build(): self
    {
        $link = url('/validator/reset-password?token='.$this->token.'&email='.urlencode($this->email));
        return $this->subject('Validator Password Reset')
            ->view('emails.validator_reset_password', ['link' => $link]);
    }
}


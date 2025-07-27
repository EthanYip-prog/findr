const COGNITO = {
  region: "us-east-1",
  userPoolId: "us-east-1_PonHnBDiy",
  clientId: "4e7gg7980fufcvofe172nqnplo",
};


AWS.config.region = COGNITO.region;
var cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();


function registerUser() {
  console.log("registerUser function called");
  var username = document.querySelector('input[type="text"]').value.trim();
  var password = document.querySelector('input[type="password"]').value.trim();
  var email = document.querySelector('input[type="email"]').value.trim();

  if (!username) {
    alert("Please enter a username");
    return;
  }

  if (!password) {
    alert("Please enter a password");
    return;
  }

  if (!email) {
    alert("Please enter an email"); 
    return;
  }

  if (password.length < 8) {
    alert("Password must be at least 8 characters long");
    return;
  }

  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address"); 
    return;
  }

  console.log("Registration data:", { username, email }); 

  // Cognito sign up parameters (Postman)
  var params = {
    ClientId: COGNITO.clientId,
    Username: username,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
    ],
  };


  var registerBtn = document.querySelector(".register-btn");
  var originalText = registerBtn.textContent;
  registerBtn.textContent = "Registering...";
  registerBtn.disabled = true;

  cognitoIdentityServiceProvider.signUp(params, function (err, data) {
    registerBtn.textContent = originalText;
    registerBtn.disabled = false;

    if (err) {
      console.error("Registration error:", err);
      switch (err.code) { // Handles specific Cognito errors
        case "UsernameExistsException":
          alert("Username already exists. Please choose a different username.");
          break;
        case "InvalidPasswordException":
          alert(
            "Password does not meet requirements. Please ensure it has at least 8 characters, including uppercase, lowercase, numbers, and special characters."
          );
          break;
        case "InvalidParameterException":
          alert("Invalid input. Please check your information and try again.");
          break;
        default:
          alert("Registration failed: " + err.message);
      }
    } else {
      console.log("Registration successful:", data);

      if (data.UserSub) {
        alert(
          "Registration successful! Please check your email for verification code."
        );

        localStorage.setItem("pendingUsername", username);
        document.querySelector("form").reset();
        setTimeout(function () {
          window.location.href = "email_verification_page.html";
        }, 2000);
      }
    }
  });
}


function loginUser() {
  console.log("loginUser function called");
  var username = document.querySelector('input[type="text"]').value.trim();
  var password = document.querySelector('input[type="password"]').value.trim();


  if (!username) {
    alert("Please enter a username");
    return;
  }

  if (!password) {
    alert("Please enter a password");
    return;
  }

  console.log("Login attempt for username:", username);
  var params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: COGNITO.clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  };

  var loginBtn = document.querySelector(".login-btn");
  var originalText = loginBtn.textContent;
  loginBtn.textContent = "Logging in...";
  loginBtn.disabled = true;

 
  cognitoIdentityServiceProvider.initiateAuth(params, function (err, data) {
    loginBtn.textContent = originalText;
    loginBtn.disabled = false;

    if (err) {
      console.error("Login error:", err);

      // Handle specific Cognito errors
      switch (err.code) {
        case "NotAuthorizedException":
          alert("Incorrect username or password. Please try again.");
          break;
        case "UserNotConfirmedException":
          alert(
            "Please verify your email address before logging in. You will be redirected to the verification page."
          );
          setTimeout(function () {
            window.location.href = "email_verification_page.html";
          }, 2000);
          break;
        case "UserNotFoundException":
          alert(
            "User not found. Please check your username or register for a new account."
          );
          break;
        case "TooManyRequestsException":
          alert("Too many login attempts. Please wait a moment and try again.");
          break;
        default:
          alert("Login failed: " + err.message);
      }
    } else {
      console.log("Login successful:", data);

      if (data.AuthenticationResult) {
        localStorage.setItem(
          "accessToken",
          data.AuthenticationResult.AccessToken
        );
        localStorage.setItem("idToken", data.AuthenticationResult.IdToken);
        localStorage.setItem(
          "refreshToken",
          data.AuthenticationResult.RefreshToken
        );

        alert("Login successful! Welcome!");
        window.location.href = "main_page.html";
      }
    }
  });
}


document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, checking for forms...");
  var registerForm = document.querySelector("form");
  var registerBtn = document.querySelector(".register-btn");

  if (registerBtn) {
    console.log("Found register form, attaching event listener");

    registerForm.addEventListener("submit", function (event) {
      console.log("Register form submitted!");
      event.preventDefault(); // Prevent normal form submission
      registerUser(); 
    });
  }


  var loginBtn = document.querySelector(".login-btn");

  if (loginBtn) {
    console.log("Found login form, attaching event listener");

    var loginForm = document.querySelector("form");
    loginForm.addEventListener("submit", function (event) {
      console.log("Login form submitted!");
      event.preventDefault(); // Prevent normal form submission
      loginUser(); 
    });
  }

  if (window.location.pathname.includes("email_verification_page.html")) {
    console.log("On verification page, setting up verification form");
    // Auto-fill username if coming from registration
    var pendingUsername = localStorage.getItem("pendingUsername");
    if (pendingUsername) {
      var usernameField = document.getElementById("verify-username");
      if (usernameField) {
        usernameField.value = pendingUsername;
        console.log("Auto-filled username:", pendingUsername);
      }
    }

    var verifyForm = document.querySelector("form");
    if (verifyForm) {
      verifyForm.addEventListener("submit", function (event) {
        console.log("Verification form submitted!");
        verifyUser(event);
      });
    }
  }
});


function isUserLoggedIn() {
  var accessToken = localStorage.getItem("accessToken");
  return accessToken !== null;
}


function logoutUser() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("idToken");
  localStorage.removeItem("refreshToken");

  alert("You have been logged out successfully.");
  window.location.href = "login.html";
}


function getCurrentUser() {
  var idToken = localStorage.getItem("idToken");

  if (idToken) {
    try {
      var base64Url = idToken.split(".")[1];
      var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      var jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  return null;
}


function verifyUser(event) {
  event.preventDefault();
  console.log("verifyUser function called");
  var username = document.getElementById("verify-username").value.trim();
  var confirmationCode = document
    .getElementById("verification-code")
    .value.trim();


  if (!username) {
    alert("Please enter your username");
    return;
  }

  if (!confirmationCode) {
    alert("Please enter the verification code");
    return;
  }

  console.log("Verification attempt for username:", username);


  var params = {
    ClientId: COGNITO.clientId,
    Username: username,
    ConfirmationCode: confirmationCode,
  };


  var verifyBtn = document.querySelector(".btn-wrap button");
  var originalText = verifyBtn.textContent;
  verifyBtn.textContent = "Verifying...";
  verifyBtn.disabled = true;


  cognitoIdentityServiceProvider.confirmSignUp(params, function (err, data) {
    // Reset button state
    verifyBtn.textContent = originalText;
    verifyBtn.disabled = false;

    if (err) {
      console.error("Verification error:", err);

      // Handle specific Cognito errors
      switch (err.code) {
        case "CodeMismatchException":
          alert(
            "Invalid verification code. Please check your email and try again."
          );
          break;
        case "ExpiredCodeException":
          alert("Verification code has expired. Please request a new code.");
          break;
        case "UserNotFoundException":
          alert("User not found. Please check your username.");
          break;
        case "NotAuthorizedException":
          alert("User is already confirmed or verification failed.");
          break;
        default:
          alert("Verification failed: " + err.message);
      }
    } else {
      console.log("Verification successful:", data);
      alert("Account verified successfully! You can now login.");

      localStorage.removeItem("pendingUsername");

      document.querySelector("form").reset();

      setTimeout(function () {
        window.location.href = "login.html";
      }, 2000);
    }
  });
}


function resendVerificationCode() {
  var username = document.getElementById("verify-username").value.trim();

  if (!username) {
    alert("Please enter your username first");
    return;
  }

  var params = {
    ClientId: COGNITO.clientId,
    Username: username,
  };

  cognitoIdentityServiceProvider.resendConfirmationCode(
    params,
    function (err, data) {
      if (err) {
        console.error("Resend error:", err);
        alert("Failed to resend code: " + err.message);
      } else {
        console.log("Code resent successfully:", data);
        alert("New verification code sent to your email!");
      }
    }
  );
}

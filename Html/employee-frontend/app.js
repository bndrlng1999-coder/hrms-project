var app = angular.module("tanvoxApp", []);

app.controller("MainCtrl", function($scope, $http) {

    // TOAST SYSTEM
$scope.toasts = [];
$scope.toastId = 0;

$scope.showToast = function(message, type) {
    var id = ++$scope.toastId;

    $scope.toasts.push({
        id: id,
        message: message,
        type: type || "info"
    });

    setTimeout(function() {
        $scope.$applyAsync(function() {
            $scope.toasts = $scope.toasts.filter(function(t) {
                return t.id !== id;
            });
        });
    }, 3000);
};

    var studentUrl = "http://localhost:8080/api/students";
    var companyUrl = "http://localhost:8080/api/companies";

    $scope.student = {};
    $scope.students = [];
    $scope.company = {};
    $scope.companies = [];

    $scope.resume = {};
    $scope.generatedResume = null;

    $scope.answers = {};
    $scope.testScore = null;

    $scope.codeInput = "";
    $scope.codeOutput = "";

    $scope.aiQuestion = "";
    $scope.aiReply = "";

    $scope.user = {};
    $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser")) || null;
    $scope.darkMode = JSON.parse(localStorage.getItem("darkMode")) || false;
    $scope.selectedPlan = "";

    $scope.showToast("Login successful ✔", "success");
    $scope.showPassword = false;
    $scope.showToast("Registered successfully ✔", "success");
    $scope.showToast("Login failed ❌", "error");
    $scope.authLoading = false;

    $scope.checkEmail = function(email) {
        if (!email) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    };

    $scope.hasToken = function() {
        return !!localStorage.getItem("token");
    };

    $scope.getAuthHeaders = function() {
        return {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token")
            }
        };
    };

    $scope.toggleDarkMode = function() {
        $scope.darkMode = !$scope.darkMode;
        localStorage.setItem("darkMode", $scope.darkMode);
    };

    $scope.switchAuthMode = function(mode) {
        $scope.authMode = mode;
        $scope.user = {};
        $scope.authMessage = "";
        $scope.authError = "";
        $scope.showPassword = false;
    };

    $scope.loadStudents = function() {
        if (!$scope.hasToken() || !$scope.loggedInUser || $scope.loggedInUser.role !== "ADMIN") {
            $scope.students = [];
            return;
        }

        $http.get(studentUrl, $scope.getAuthHeaders()).then(function(res) {
            $scope.students = res.data;
        }, function(err) {
            console.log("Student load error", err);
        });
    };

    $scope.loadCompanies = function() {
        if (!$scope.hasToken() || !$scope.loggedInUser || $scope.loggedInUser.role !== "ADMIN") {
            $scope.companies = [];
            return;
        }

        $http.get(companyUrl, $scope.getAuthHeaders()).then(function(res) {
            $scope.companies = res.data;
        }, function(err) {
            console.log("Company load error", err);
        });
    };

    $scope.add = function() {
        $http.post(studentUrl, $scope.student, $scope.getAuthHeaders()).then(function() {
            $scope.student = {};
            $scope.loadStudents();
        }, function(err) {
            console.log("Student add error", err);
        });
    };

    $scope.delete = function(id) {
        $http.delete(studentUrl + "/" + id, $scope.getAuthHeaders()).then(function() {
            $scope.loadStudents();
        }, function(err) {
            console.log("Student delete error", err);
        });
    };

    $scope.assignPlacement = function(student) {
        student.status = "Placed";
        $http.put(studentUrl + "/" + student.id, student, $scope.getAuthHeaders()).then(function() {
            $scope.loadStudents();
        }, function(err) {
            console.log("Placement error", err);
        });
    };

    $scope.addCompany = function() {
        $http.post(companyUrl, $scope.company, $scope.getAuthHeaders()).then(function() {
            $scope.company = {};
            $scope.loadCompanies();
        }, function(err) {
            console.log("Company add error", err);
        });
    };

    $scope.deleteCompany = function(id) {
        $http.delete(companyUrl + "/" + id, $scope.getAuthHeaders()).then(function() {
            $scope.loadCompanies();
        }, function(err) {
            console.log("Company delete error", err);
        });
    };

    $scope.generateResume = function() {
        $scope.generatedResume = angular.copy($scope.resume);
    };

    $scope.downloadResume = function() {
        var content = `
Resume

Name: ${$scope.generatedResume ? $scope.generatedResume.name || "" : ""}
Email: ${$scope.generatedResume ? $scope.generatedResume.email || "" : ""}
Phone: ${$scope.generatedResume ? $scope.generatedResume.phone || "" : ""}
Skills: ${$scope.generatedResume ? $scope.generatedResume.skills || "" : ""}
Education: ${$scope.generatedResume ? $scope.generatedResume.education || "" : ""}
Experience: ${$scope.generatedResume ? $scope.generatedResume.experience || "" : ""}
        `;

        var blob = new Blob([content], { type: "text/plain" });
        var link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "resume.txt";
        link.click();
    };

    $scope.submitTest = function() {
        var score = 0;
        if ($scope.answers.q1 === "Programming Language") score++;
        if ($scope.answers.q2 === "Spring Boot") score++;
        if ($scope.answers.q3 === "MySQL") score++;
        $scope.testScore = score;
    };

    $scope.runCode = function() {
        if (($scope.codeInput || "").toLowerCase().includes("reverse")) {
            $scope.codeOutput = "Output: olleh";
        } else {
            $scope.codeOutput = "Try writing reverse logic!";
        }
    };

    $scope.selectPlan = function(plan) {
        $scope.selectedPlan = plan;
    };

    $scope.proceedPayment = function() {
        if ($scope.selectedPlan === "Training - 19999") {
            alert("Redirecting to payment gateway for ₹19,999...");
        } else if ($scope.selectedPlan === "Training + Placement - 35999") {
            alert("Redirecting to payment gateway for ₹35,999...");
        } else {
            alert("Please select a plan first");
        }
    };

    $scope.register = function() {
        $scope.authMessage = "";
        $scope.authError = "";

        if (!$scope.user.name || !$scope.user.email || !$scope.user.password || !$scope.user.role) {
            $scope.authError = "Please fill all register fields";
            return;
        }

        if (!$scope.checkEmail($scope.user.email)) {
            $scope.authError = "Enter valid email address";
            return;
        }

        $scope.authLoading = true;

        $http.post("http://localhost:8080/api/auth/register", $scope.user).then(function() {
            $scope.authMessage = "Registered successfully ✔";
            $scope.user = {};
            $scope.authMode = "login";
        }, function() {
            $scope.authError = "Registration failed";
        }).finally(function() {
            $scope.authLoading = false;
        });
    };

    $scope.login = function() {
        $scope.authMessage = "";
        $scope.authError = "";

        if (!$scope.user.email || !$scope.user.password) {
            $scope.authError = "Please enter email and password";
            return;
        }

        if (!$scope.checkEmail($scope.user.email)) {
            $scope.authError = "Enter valid email address";
            return;
        }

        $scope.authLoading = true;

        $http.post("http://localhost:8080/api/auth/login", $scope.user).then(function(res) {
            if (res.data && res.data.token) {
                $scope.loggedInUser = res.data.user;
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("loggedInUser", JSON.stringify(res.data.user));

                if ($scope.loggedInUser.role === "ADMIN") {
                    $scope.loadStudents();
                    $scope.loadCompanies();
                } else {
                    $scope.students = [];
                    $scope.companies = [];
                }
            } else {
                $scope.authError = "Invalid credentials";
            }
        }, function() {
            $scope.authError = "Login failed";
        }).finally(function() {
            $scope.authLoading = false;
        });
    };

    $scope.logout = function() {
        localStorage.removeItem("token");
        localStorage.removeItem("loggedInUser");
        $scope.loggedInUser = null;
        $scope.user = {};
        $scope.students = [];
        $scope.companies = [];
        $scope.authMessage = "";
        $scope.authError = "";
    };

    $scope.askAIInterview = function() {
        var question = ($scope.aiQuestion || "").trim();

        if (!question) {
            alert("Please enter a question");
            return;
        }

        $scope.aiReply = "Thinking...";

        $http.post(
            "http://localhost:8080/api/ai/interview",
            { question: question },
            $scope.getAuthHeaders()
        ).then(function(res) {
            $scope.aiReply = res.data.reply || "No response received.";
        }, function(err) {
            console.log("AI error", err);
            $scope.aiReply = "AI request failed. Check backend console.";
        });
    };

    $scope.getPlacedStudentsCount = function() {
        return ($scope.students || []).filter(function(s) {
            return s.status === "Placed";
        }).length;
    };

    $scope.getTrainingPlacementCount = function() {
        return ($scope.students || []).filter(function(s) {
            return s.course === "Training + Placement - 35999";
        }).length;
    };

    $scope.getPlacementPercentage = function() {
        if (!$scope.students || $scope.students.length === 0) return 0;
        return ($scope.getPlacedStudentsCount() / $scope.students.length) * 100;
    };

    $scope.getTrainingPlacementPercentage = function() {
        if (!$scope.students || $scope.students.length === 0) return 0;
        return ($scope.getTrainingPlacementCount() / $scope.students.length) * 100;
    };

    if ($scope.loggedInUser && $scope.hasToken() && $scope.loggedInUser.role === "ADMIN") {
        $scope.loadStudents();
        $scope.loadCompanies();
    }
});

$scope.getPasswordStrength = function(password) {
    if (!password) return { label: "", score: 0 };

    var score = 0;

    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: "Weak", score: 1 };
    if (score <= 3) return { label: "Medium", score: 2 };
    return { label: "Strong", score: 3 };
};

$scope.isAuthValid = function() {
    if (!$scope.user) return false;

    // email + password required
    if (!$scope.user.email || !$scope.checkEmail($scope.user.email)) return false;
    if (!$scope.user.password) return false;

    // register checks
    if ($scope.authMode === "register") {
        if (!$scope.user.name || !$scope.user.role) return false;

        var strength = $scope.getPasswordStrength($scope.user.password);
        if (strength.score < 2) return false; // block weak password
    }

    return true;
};
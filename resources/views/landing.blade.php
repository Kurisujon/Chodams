<!DOCTYPE html>
<html lang="en">
	<head>
		<!-- Required meta tags --> 
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
		<title>The Development of the City Housing Data Management System</title>
		<link rel="stylesheet" href="landing/vendors/mdi/css/materialdesignicons.min.css">
		<link rel="stylesheet" href="landing/vendors/owl.carousel/css/owl.carousel.css">
		<link rel="stylesheet" href="landing/vendors/owl.carousel/css/owl.theme.default.min.css">
		<link rel="stylesheet" href="landing/vendors/aos/css/aos.css">
		<link rel="stylesheet" href="landing/vendors/jquery-flipster/css/jquery.flipster.css">
		<link rel="stylesheet" href="landing/css/style.css">
		<style>
		.lp-header{position:sticky;top:0;z-index:1000;background:rgba(255,255,255,0.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(0,0,0,0.06)}
		.lp-container{max-width:1200px;margin:0 auto;padding:12px 16px;display:flex;align-items:center;gap:24px}
		.lp-brand{display:flex;align-items:center;gap:10px;text-decoration:none}
		.lp-emoji{font-size:24px}
		.lp-brand-text{font-size:22px;font-weight:700;color:#111827}
		.lp-links{display:flex;align-items:center;gap:28px;margin-left:24px}
		.lp-link{color:#374151;text-decoration:none;font-weight:500}
		.lp-link:hover{color:#111827}
		.lp-actions{margin-left:auto;display:flex;align-items:center;gap:16px}
		.lp-login{color:#111827;text-decoration:none;font-weight:500}
		.lp-signup{background:#3B82F6;color:#fff;padding:8px 16px;border-radius:10px;text-decoration:none;font-weight:600;box-shadow:0 4px 10px rgba(59,130,246,0.3)}
		@media(max-width:768px){.lp-links{display:none}}
		</style>
		<link rel="shortcut icon" href="landing/images/favicon.png" />
	</head>
	<header class="lp-header">
		<div class="lp-container">
			<a href="#home" class="lp-brand"><span class="lp-emoji">🚀</span><span class="lp-brand-text">Startup</span></a>
			<nav class="lp-links">
				<a href="#home" class="lp-link">Home</a>
				<a href="#payment" class="lp-link">Payment</a>
				<a href="#features" class="lp-link">Features</a>
			</nav>
			<div class="lp-actions">
				<a href="{{ url('/login') }}" class="lp-login">Login</a>
				<a href="{{ url('/register') }}" class="lp-signup">Sign Up</a>
			</div>
		</div>
	</header>
<section id="home" class="home-section">
  <div class="container">
    <div class="row">
      <div class="col-sm-12">
        <div class="main-banner">
          <div class="d-sm-flex align-items-center justify-content-between">
            <!-- Logo Section -->
            <div class="logo" data-aos="zoom-in-up">
              <img src="logo.png" alt="Logo" class="logo-image">
            </div>
            <!-- Text Section -->
            <div class="text-content" data-aos="zoom-in-up">
              <div class="banner-title">
                <h3 class="font-weight-medium">
                  Innovative Housing for Digos City — Lifting
                </h3>
              </div>
              <p class="mt-3">
                Communities, Creating Lasting Change.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

			<section class="logo_section"> 
				<div class="logo_container">
					<img src="image/group.png" alt="Logo 1" class="logo-img">
					<img src="images/logo7.png" alt="chodams" clas="logo-img">
					<img src="image/umdclogo.png" alt="Logo 3" class="logo-img">
					
				</div>
			</section>

			<!-----ABOUT THE PROJECT SECTION------>
			<section class="our-services" id="services">
				<div class="container">
					<div class="row">
						<div class="col-sm-12">
							<h3 class="font-weight-medium text-dark mb-5">About The Project</h3>
						</div>
					</div>
					<div class="row" data-aos="fade-up">
						<div class="col-sm-4 text-center text-lg-left">
							<div class="services-box" data-aos="fade-down" data-aos-easing="linear" data-aos-duration="1500">
								<img src="images/saving-strategy.svg" alt="saving-strategy" data-aos="zoom-in">
								<h6 class="text-dark mb-3 mt-4 font-weight-medium">Data Management System</h6>
								<p>Organized data collection, validation, 
									storage, and reporting processes that enhance 
									the accuracy and efficiency of managing beneficiary information.
								</p>
							</div>
						</div>
						<div class="col-sm-4 text-center text-lg-left">
							<div class="services-box"   data-aos="fade-down" data-aos-easing="linear" data-aos-duration="1500">
								<img src="images/design-development.svg" alt="design-development" data-aos="zoom-in">
								<h6 class="text-dark mb-3 mt-4 font-weight-medium"> Automated Survey
								</h6>
								<p> Streamlines 
									survey processes, automates data collection, 
									and enhances analysis for efficient decision-making.

								</p>
							</div>
						</div>
						<div class="col-sm-4 text-center text-lg-left">
							<div class="services-box" data-aos="fade-down" data-aos-easing="linear" data-aos-duration="1500">
								<img src="images/digital-strategy.svg" alt="digital-strategy" data-aos="zoom-in">
								<h6 class="text-dark mb-3 mt-4 font-weight-medium">User-Friendly Platform</h6>
								<p>Designed to simplify processes, 
									ensuring seamless navigation, efficient data management,
									and accessibility for users of all skill levels.
								</p>
							</div>
						</div>	
					</div>
					<div class="row" data-aos="fade-up">
						<div class="col-sm-4 text-center text-lg-left">
							<div class="services-box pb-lg-0" data-aos="fade-down" data-aos-easing="linear" data-aos-duration="1500">
								<img src="images/growth-strategy.svg" alt="growth-strategy" data-aos="zoom-in">
								<h6 class="text-dark mb-3 mt-4 font-weight-medium">Role-Based System</h6>
								<p>User authentication and authorization with different
								privilege in terms of accessing the system. 
								</p>
							</div>
						</div>
						<div class="col-sm-4 text-center text-lg-left">
							<div class="services-box pb-0" data-aos="fade-down" data-aos-easing="linear" data-aos-duration="1500">
								<img src="images/digital-marketing.svg" alt="digital-marketing" data-aos="zoom-in">
								<h6 class="text-dark mb-3 mt-4 font-weight-medium">Data Visualization</h6>
								<p>Show varied information using pre-defined templates 
									allowing for quick viewing of the information gathered.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-----PROJECT FEATURES SECTION------>
			<section class="our-process" id="about">
				<div class="container">
					<div class="row">
						<div class="col-sm-6" data-aos="fade-up">
							<h5 class="text-dark">About The Department</h5>
							<h3 class="font-weight-medium text-dark">City Housing Relocation Resettlement And Site Development program</h3>
							<div class="d-flex justify-content-start mb-3">
								<img src="images/tick.png" alt="tick" class="mr-3 tick-icon"  >
								<p class="mb-0">"Stakeholders discuss plans for affordable housing development."</p>
							</div>
							<div class="d-flex justify-content-start mb-3">
								<img src="images/tick.png" alt="tick" class="mr-3 tick-icon"  >
								<p class="mb-0">"Groundbreaking ceremony for new housing projects."</p>
							</div>
							<div class="d-flex justify-content-start">
								<img src="images/tick.png" alt="tick" class="mr-3 tick-icon"  >
								<p class="mb-0">Teams collaborate to implement housing solutions effectively."</p>
							</div>
						</div>
						<div class="col-sm-6 text-right" data-aos="flip-left" data-aos-easing="ease-out-cubic" data-aos-duration="2000">
							<img src="images/picturedp.jpg" alt="idea" class="img-fluid">
						</div>
					</div>
				</div>
			</section>

			<!-----TEAM SECTION------>
			<section class="clients pt-5 mt-5"  data-aos="fade-up" data-aos-offset="-400">
				<div class="container">
					<div class="row">
						<div class="col-sm-12">
							<div class="d-sm-flex justify-content-between align-items-center">
								<img src="images/deloit.svg" alt="deloit" class="p-2 p-lg-0" data-aos="fade-down"  data-aos-offset="-400">
								<img src="images/erricson.svg" alt="erricson" class="p-2 p-lg-0" data-aos="fade-up"  data-aos-offset="-400">
								<img src="images/netflix.svg" alt="netflix" class="p-2 p-lg-0" data-aos="fade-down"  data-aos-offset="-400">
								<img src="images/instagram.svg" alt="instagram" class="p-2 p-lg-0" data-aos="fade-up"  data-aos-offset="-400">
								<img src="images/coinbase.svg" alt="coinbase" class="p-2 p-lg-0" data-aos="fade-down"  data-aos-offset="-400">
							</div>
						</div>
					</div>
				</div>
			</section>
			<section class="pricing-list" id="plans">
				<div class="container">
					<div class="row" data-aos="fade-up" data-aos-offset="-500">
						<div class="col-sm-12">
							<div class="d-sm-flex justify-content-between align-items-center mb-2">
								<div>
									<h3 class="font-weight-medium text-dark ">Our Team</h3>
									<h5 class="text-dark ">Lorem ipsum dolor sit amet, consectetur pretium pretium tempor. Lorem ipsum dolor </h5>
								</div>
								<div class="mb-5 mb-lg-0 mt-3 mt-lg-0">
									<div class="d-flex align-items-center">
										<p class="mr-2 font-weight-medium monthly text-active check-box-label">Monthly</p>
										<label class="toggle-switch toggle-switch">
										<input type="checkbox" checked  id="toggle-switch">
										<span class="toggle-slider round"></span>
										</label>
										<p class="ml-2 font-weight-medium yearly check-box-label">Yearly</p>
									</div>
								</div>
							</div>
						</div>
					</div>
					
			<section class="contactus" id="contact">
				<div class="container">
					<div class="row mb-5 pb-5">
						<div class="col-sm-5" data-aos="fade-up" data-aos-offset="-500">
							<img src="images/contact.jpg" alt="contact" class="img-fluid">
						</div>
						<div class="col-sm-7" data-aos="fade-up" data-aos-offset="-500">
							<h3 class="font-weight-medium text-dark mt-5 mt-lg-0">Got A Problem</h3>
							<h5 class="text-dark mb-5">Lorem ipsum dolor sit amet, consectetur pretium</h5>
							<form>
								<div class="row">
									<div class="col-sm-6">
										<div class="form-group">
											<input type="text" class="form-control" id="name" placeholder="Name*">
										</div>
									</div>
									<div class="col-sm-6">
										<div class="form-group">
											<input type="email" class="form-control" id="mail" placeholder="Email*">
										</div>
									</div>
									<div class="col-sm-12">
										<div class="form-group">
											<textarea name="message" id="message" class="form-control" placeholder="Message*" rows="5"></textarea>
										</div>
									</div>
									<div class="col-sm-12">
										<a href="#" class="btn btn-secondary">SEND</a>
									</div>
								</div>
							</form>
						</div>
					</div>
				</div>
			</section>
		</div>
		<footer class="footer">
			<div class="footer-top">
				<div class="container">
					<div class="row">
						<div class="col-sm-6">
							<address>
								<p>143 castle road 517</p>
								<p class="mb-4">district, kiyev port south Canada</p>
								<div class="d-flex align-items-center">
									<p class="mr-4 mb-0">+3 123 456 789</p>
									<a href="mailto:info@yourmail.com" class="footer-link">info@yourmail.com</a>
								</div>
								<div class="d-flex align-items-center">
									<p class="mr-4 mb-0">+1 222 345 342</p>
									<a href="mailto:Marshmallow@yourmail.com" class="footer-link">Marshmallow@yourmail.com</a>
								</div>
							</address>
							<div class="social-icons">
								<h6 class="footer-title font-weight-bold">
									Social Share
								</h6>
								<div class="d-flex">
									<a href="#"><i class="mdi mdi-github-circle"></i></a>
									<a href="#"><i class="mdi mdi-facebook-box"></i></a>
									<a href="#"><i class="mdi mdi-twitter"></i></a>
									<a href="#"><i class="mdi mdi-dribbble"></i></a>
								</div>
							</div>
						</div>
						<div class="col-sm-6">
							<div class="row">
								<div class="col-sm-4">
									<h6 class="footer-title">Social Share</h6>
									<ul class="list-footer">
										<li><a href="#" class="footer-link">Home</a></li>
										<li><a href="#" class="footer-link">About</a></li>
										<li><a href="#" class="footer-link">Services</a></li>
										<li><a href="#" class="footer-link">Portfolio</a></li>
										<li><a href="#" class="footer-link">Contact</a></li>
									</ul>
								</div>
								<div class="col-sm-4">
									<h6 class="footer-title">Product</h6>
									<ul class="list-footer">
										<li><a href="#" class="footer-link">Digital Marketing</a></li>
										<li><a href="#" class="footer-link">Web Development</a></li>
										<li><a href="#" class="footer-link">App Development</a></li>
										<li><a href="#" class="footer-link">Design</a></li>
									</ul>
								</div>
								<div class="col-sm-4">
									<h6 class="footer-title">Company</h6>
									<ul class="list-footer">
										<li><a href="#" class="footer-link">Partners</a></li>
										<li><a href="#" class="footer-link">Investors</a></li>
										<li><a href="#" class="footer-link">Partners</a></li>
										<li><a href="#" class="footer-link">FAQ</a></li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="footer-bottom">
				<div class="container">
					<div class="d-flex justify-content-between align-items-center">
						<div class="d-flex align-items-center">
							<img src="images/logo.svg" alt="logo" class="mr-3"></br>
							<p class="mb-0 text-small pt-1">© 2019-2020 <a href="https://www.bootstrapdash.com" class="text-white" target="_blank">BootstrapDash</a>. All rights reserved.</p>
            
							<p class="mb-0 text-small pt-1 pl-4">Distributed By: <a href="https://www.themewagon.com" class="text-white" target="_blank">Themewagon</a></p>
						</div>
           
						<div>
							<div class="d-flex">
								<a href="#" class="text-small text-white mx-2 footer-link">Privacy Policy </a>          
								<a href="#" class="text-small text-white mx-2 footer-link">Customer Support </a>
								<a href="#" class="text-small text-white mx-2 footer-link">Careers Guide</a>
							</div>
						</div>
					</div>

				</div>
			</div>
		</footer>
		<script src="vendors/base/vendor.bundle.base.js"></script>
		<script src="vendors/owl.carousel/js/owl.carousel.js"></script>
		<script src="vendors/aos/js/aos.js"></script>
		<script src="vendors/jquery-flipster/js/jquery.flipster.min.js"></script>
		<script src="js/template.js"></script>
	</body>
</html><!DOCTYPE html>
<html lang="en">
	<head>
		<!-- Required meta tags --> 
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
		<title>The Development of the City Housing Data Management System</title>
		<link rel="stylesheet" href="vendors/mdi/css/materialdesignicons.min.css">
		<link rel="stylesheet" href="vendors/owl.carousel/css/owl.carousel.css">
		<link rel="stylesheet" href="vendors/owl.carousel/css/owl.theme.default.min.css">
		<link rel="stylesheet" href="vendors/aos/css/aos.css">
		<link rel="stylesheet" href="vendors/jquery-flipster/css/jquery.flipster.css">
		<link rel="stylesheet" href="css/style.css">
		<style>
		.lp-header{position:sticky;top:0;z-index:1000;background:rgba(255,255,255,0.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(0,0,0,0.06)}
		.lp-container{max-width:1200px;margin:0 auto;padding:12px 16px;display:flex;align-items:center;gap:24px}
		.lp-brand{display:flex;align-items:center;gap:10px;text-decoration:none}
		.lp-emoji{font-size:24px}
		.lp-brand-text{font-size:22px;font-weight:700;color:#111827}
		.lp-links{display:flex;align-items:center;gap:28px;margin-left:24px}
		.lp-link{color:#374151;text-decoration:none;font-weight:500}
		.lp-link:hover{color:#111827}
		.lp-actions{margin-left:auto;display:flex;align-items:center;gap:16px}
		.lp-login{color:#111827;text-decoration:none;font-weight:500}
		.lp-signup{background:#3B82F6;color:#fff;padding:8px 16px;border-radius:10px;text-decoration:none;font-weight:600;box-shadow:0 4px 10px rgba(59,130,246,0.3)}
		@media(max-width:768px){.lp-links{display:none}}
		</style>
		<link rel="shortcut icon" href="images/favicon.png" />
	</head>
	<header class="lp-header">
		<div class="lp-container">
			<a href="#home" class="lp-brand"><span class="lp-emoji">🚀</span><span class="lp-brand-text">Startup</span></a>
			<nav class="lp-links">
				<a href="#home" class="lp-link">Home</a>
				<a href="#payment" class="lp-link">Payment</a>
				<a href="#features" class="lp-link">Features</a>
			</nav>
			<div class="lp-actions">
				<a href="{{ url('/login') }}" class="lp-login">Login</a>
				<a href="{{ url('/register') }}" class="lp-signup">Sign Up</a>
			</div>
		</div>
	</header>
<section id="home" class="home-section">
  <div class="container">
    <div class="row">
      <div class="col-sm-12">
        <div class="main-banner">
          <div class="d-sm-flex align-items-center justify-content-between">
            <!-- Logo Section -->
            <div class="logo" data-aos="zoom-in-up">
              <img src="logo.png" alt="Logo" class="logo-image">
            </div>
            <!-- Text Section -->
            <div class="text-content" data-aos="zoom-in-up">
              <div class="banner-title">
                <h3 class="font-weight-medium">
                  Innovative Housing for Digos City — Lifting
                </h3>
              </div>
              <p class="mt-3">
                Communities, Creating Lasting Change.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

			<section class="logo_section"> 
				<div class="logo_container">
					<img src="image/group.png" alt="Logo 1" class="logo-img">
					<img src="images/logo7.png" alt="chodams" clas="logo-img">
					<img src="image/umdclogo.png" alt="Logo 3" class="logo-img">
					
				</div>
			</section>

			<!-----ABOUT THE PROJECT SECTION------>
			<section class="our-services" id="services">
				<div class="container">
					<div class="row">
						<div class="col-sm-12">
							<h3 class="font-weight-medium text-dark mb-5">About The Project</h3>
						</div>
					</div>
					<div class="row" data-aos="fade-up">
						<div class="col-sm-4 text-center text-lg-left">
							<div class="services-box" data-aos="fade-down" data-aos-easing="linear" data-aos-duration="1500">
								<img src="images/saving-strategy.svg" alt="saving-strategy" data-aos="zoom-in">
								<h6 class="text-dark mb-3 mt-4 font-weight-medium">Data Management System</h6>
								<p>Organized data collection, validation, 
									storage, and reporting processes that enhance 
									the accuracy and efficiency of managing beneficiary information.
								</p>
							</div>
						</div>
						<div class="col-sm-4 text-center text-lg-left">
							<div class="services-box"   data-aos="fade-down" data-aos-easing="linear" data-aos-duration="1500">
								<img src="images/design-development.svg" alt="design-development" data-aos="zoom-in">
								<h6 class="text-dark mb-3 mt-4 font-weight-medium"> Automated Survey
								</h6>
								<p> Streamlines 
									survey processes, automates data collection, 
									and enhances analysis for efficient decision-making.

								</p>
							</div>
						</div>
						<div class="col-sm-4 text-center text-lg-left">
							<div class="services-box" data-aos="fade-down" data-aos-easing="linear" data-aos-duration="1500">
								<img src="images/digital-strategy.svg" alt="digital-strategy" data-aos="zoom-in">
								<h6 class="text-dark mb-3 mt-4 font-weight-medium">User-Friendly Platform</h6>
								<p>Designed to simplify processes, 
									ensuring seamless navigation, efficient data management,
									and accessibility for users of all skill levels.
								</p>
							</div>
						</div>	
					</div>
					<div class="row" data-aos="fade-up">
						<div class="col-sm-4 text-center text-lg-left">
							<div class="services-box pb-lg-0" data-aos="fade-down" data-aos-easing="linear" data-aos-duration="1500">
								<img src="images/growth-strategy.svg" alt="growth-strategy" data-aos="zoom-in">
								<h6 class="text-dark mb-3 mt-4 font-weight-medium">Role-Based System</h6>
								<p>User authentication and authorization with different
								privilege in terms of accessing the system. 
								</p>
							</div>
						</div>
						<div class="col-sm-4 text-center text-lg-left">
							<div class="services-box pb-0" data-aos="fade-down" data-aos-easing="linear" data-aos-duration="1500">
								<img src="images/digital-marketing.svg" alt="digital-marketing" data-aos="zoom-in">
								<h6 class="text-dark mb-3 mt-4 font-weight-medium">Data Visualization</h6>
								<p>Show varied information using pre-defined templates 
									allowing for quick viewing of the information gathered.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-----PROJECT FEATURES SECTION------>
			<section class="our-process" id="about">
				<div class="container">
					<div class="row">
						<div class="col-sm-6" data-aos="fade-up">
							<h5 class="text-dark">About The Department</h5>
							<h3 class="font-weight-medium text-dark">City Housing Relocation Resettlement And Site Development program</h3>
							<div class="d-flex justify-content-start mb-3">
								<img src="images/tick.png" alt="tick" class="mr-3 tick-icon"  >
								<p class="mb-0">"Stakeholders discuss plans for affordable housing development."</p>
							</div>
							<div class="d-flex justify-content-start mb-3">
								<img src="images/tick.png" alt="tick" class="mr-3 tick-icon"  >
								<p class="mb-0">"Groundbreaking ceremony for new housing projects."</p>
							</div>
							<div class="d-flex justify-content-start">
								<img src="images/tick.png" alt="tick" class="mr-3 tick-icon"  >
								<p class="mb-0">Teams collaborate to implement housing solutions effectively."</p>
							</div>
						</div>
						<div class="col-sm-6 text-right" data-aos="flip-left" data-aos-easing="ease-out-cubic" data-aos-duration="2000">
							<img src="images/picturedp.jpg" alt="idea" class="img-fluid">
						</div>
					</div>
				</div>
			</section>

			<!-----TEAM SECTION------>
			<section class="clients pt-5 mt-5"  data-aos="fade-up" data-aos-offset="-400">
				<div class="container">
					<div class="row">
						<div class="col-sm-12">
							<div class="d-sm-flex justify-content-between align-items-center">
								<img src="images/deloit.svg" alt="deloit" class="p-2 p-lg-0" data-aos="fade-down"  data-aos-offset="-400">
								<img src="images/erricson.svg" alt="erricson" class="p-2 p-lg-0" data-aos="fade-up"  data-aos-offset="-400">
								<img src="images/netflix.svg" alt="netflix" class="p-2 p-lg-0" data-aos="fade-down"  data-aos-offset="-400">
								<img src="images/instagram.svg" alt="instagram" class="p-2 p-lg-0" data-aos="fade-up"  data-aos-offset="-400">
								<img src="images/coinbase.svg" alt="coinbase" class="p-2 p-lg-0" data-aos="fade-down"  data-aos-offset="-400">
							</div>
						</div>
					</div>
				</div>
			</section>
			<section class="pricing-list" id="plans">
				<div class="container">
					<div class="row" data-aos="fade-up" data-aos-offset="-500">
						<div class="col-sm-12">
							<div class="d-sm-flex justify-content-between align-items-center mb-2">
								<div>
									<h3 class="font-weight-medium text-dark ">Our Team</h3>
									<h5 class="text-dark ">Lorem ipsum dolor sit amet, consectetur pretium pretium tempor. Lorem ipsum dolor </h5>
								</div>
								<div class="mb-5 mb-lg-0 mt-3 mt-lg-0">
									<div class="d-flex align-items-center">
										<p class="mr-2 font-weight-medium monthly text-active check-box-label">Monthly</p>
										<label class="toggle-switch toggle-switch">
										<input type="checkbox" checked  id="toggle-switch">
										<span class="toggle-slider round"></span>
										</label>
										<p class="ml-2 font-weight-medium yearly check-box-label">Yearly</p>
									</div>
								</div>
							</div>
						</div>
					</div>
					
			<section class="contactus" id="contact">
				<div class="container">
					<div class="row mb-5 pb-5">
						<div class="col-sm-5" data-aos="fade-up" data-aos-offset="-500">
							<img src="images/contact.jpg" alt="contact" class="img-fluid">
						</div>
						<div class="col-sm-7" data-aos="fade-up" data-aos-offset="-500">
							<h3 class="font-weight-medium text-dark mt-5 mt-lg-0">Got A Problem</h3>
							<h5 class="text-dark mb-5">Lorem ipsum dolor sit amet, consectetur pretium</h5>
							<form>
								<div class="row">
									<div class="col-sm-6">
										<div class="form-group">
											<input type="text" class="form-control" id="name" placeholder="Name*">
										</div>
									</div>
									<div class="col-sm-6">
										<div class="form-group">
											<input type="email" class="form-control" id="mail" placeholder="Email*">
										</div>
									</div>
									<div class="col-sm-12">
										<div class="form-group">
											<textarea name="message" id="message" class="form-control" placeholder="Message*" rows="5"></textarea>
										</div>
									</div>
									<div class="col-sm-12">
										<a href="#" class="btn btn-secondary">SEND</a>
									</div>
								</div>
							</form>
						</div>
					</div>
				</div>
			</section>
		</div>
		<footer class="footer">
			<div class="footer-top">
				<div class="container">
					<div class="row">
						<div class="col-sm-6">
							<address>
								<p>143 castle road 517</p>
								<p class="mb-4">district, kiyev port south Canada</p>
								<div class="d-flex align-items-center">
									<p class="mr-4 mb-0">+3 123 456 789</p>
									<a href="mailto:info@yourmail.com" class="footer-link">info@yourmail.com</a>
								</div>
								<div class="d-flex align-items-center">
									<p class="mr-4 mb-0">+1 222 345 342</p>
									<a href="mailto:Marshmallow@yourmail.com" class="footer-link">Marshmallow@yourmail.com</a>
								</div>
							</address>
							<div class="social-icons">
								<h6 class="footer-title font-weight-bold">
									Social Share
								</h6>
								<div class="d-flex">
									<a href="#"><i class="mdi mdi-github-circle"></i></a>
									<a href="#"><i class="mdi mdi-facebook-box"></i></a>
									<a href="#"><i class="mdi mdi-twitter"></i></a>
									<a href="#"><i class="mdi mdi-dribbble"></i></a>
								</div>
							</div>
						</div>
						<div class="col-sm-6">
							<div class="row">
								<div class="col-sm-4">
									<h6 class="footer-title">Social Share</h6>
									<ul class="list-footer">
										<li><a href="#" class="footer-link">Home</a></li>
										<li><a href="#" class="footer-link">About</a></li>
										<li><a href="#" class="footer-link">Services</a></li>
										<li><a href="#" class="footer-link">Portfolio</a></li>
										<li><a href="#" class="footer-link">Contact</a></li>
									</ul>
								</div>
								<div class="col-sm-4">
									<h6 class="footer-title">Product</h6>
									<ul class="list-footer">
										<li><a href="#" class="footer-link">Digital Marketing</a></li>
										<li><a href="#" class="footer-link">Web Development</a></li>
										<li><a href="#" class="footer-link">App Development</a></li>
										<li><a href="#" class="footer-link">Design</a></li>
									</ul>
								</div>
								<div class="col-sm-4">
									<h6 class="footer-title">Company</h6>
									<ul class="list-footer">
										<li><a href="#" class="footer-link">Partners</a></li>
										<li><a href="#" class="footer-link">Investors</a></li>
										<li><a href="#" class="footer-link">Partners</a></li>
										<li><a href="#" class="footer-link">FAQ</a></li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="footer-bottom">
				<div class="container">
					<div class="d-flex justify-content-between align-items-center">
						<div class="d-flex align-items-center">
							<img src="images/logo.svg" alt="logo" class="mr-3"></br>
							<p class="mb-0 text-small pt-1">© 2019-2020 <a href="https://www.bootstrapdash.com" class="text-white" target="_blank">BootstrapDash</a>. All rights reserved.</p>
            
							<p class="mb-0 text-small pt-1 pl-4">Distributed By: <a href="https://www.themewagon.com" class="text-white" target="_blank">Themewagon</a></p>
						</div>
           
						<div>
							<div class="d-flex">
								<a href="#" class="text-small text-white mx-2 footer-link">Privacy Policy </a>          
								<a href="#" class="text-small text-white mx-2 footer-link">Customer Support </a>
								<a href="#" class="text-small text-white mx-2 footer-link">Careers Guide</a>
							</div>
						</div>
					</div>

				</div>
			</div>
		</footer>
		<script src="landing/vendors/base/vendor.bundle.base.js"></script>
		<script src="landing/vendors/owl.carousel/js/owl.carousel.js"></script>
		<script src="landing/vendors/aos/js/aos.js"></script>
		<script src="landing/vendors/jquery-flipster/js/jquery.flipster.min.js"></script>
		<script src="landing/js/template.js"></script>
	</body>
</html>
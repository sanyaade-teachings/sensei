<?php
/**
 * File containing Sensei_Course_Theme class.
 *
 * @package sensei-lms
 * @since   3.13.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use \Sensei\Blocks\Course_Theme;

/**
 * Load the 'Sensei Course Theme' theme for the /learn subsite.
 *
 * @since 3.13.4
 */
class Sensei_Course_Theme {
	/**
	 * URL prefix for loading the course theme.
	 */
	const QUERY_VAR = 'learn';

	/**
	 * Directory for the course theme.
	 */
	const THEME_NAME = 'sensei-course-theme';

	/**
	 * Instance of class.
	 *
	 * @var self
	 */
	private static $instance;

	/**
	 * Sensei_Course_Theme constructor. Prevents other instances from being created outside of `self::instance()`.
	 */
	private function __construct() {
	}

	/**
	 * Fetches an instance of the class.
	 *
	 * @return self
	 */
	public static function instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Initializes the Course Theme.
	 *
	 * @param Sensei_Main $sensei Sensei object.
	 */
	public function init( $sensei ) {

		if ( ! $sensei->feature_flags->is_enabled( 'course_theme' ) ) {
			// As soon this feature flag check is removed, the `$sensei` argument can also be removed.
			return;
		}

		add_action( 'setup_theme', [ $this, 'add_rewrite_rules' ], 0, 10 );
		add_action( 'setup_theme', [ $this, 'maybe_override_theme' ], 0, 20 );

	}

	/**
	 * Is the theme active for the current request.
	 *
	 * @return bool
	 */
	public function is_active() {
		return get_query_var( self::QUERY_VAR );
	}

	/**
	 * Add the URL prefix the theme is active under.
	 *
	 * @param string $path
	 *
	 * @return string|void
	 */
	public function get_theme_redirect_url( $path = '' ) {

		if ( '' === get_option( 'permalink_structure' ) ) {
			return add_query_arg( [ self::QUERY_VAR => 1 ], $path );
		}

		return home_url( '/' . self::QUERY_VAR . '/' . $path );
	}

	/**
	 * Replace theme for the current request if it's for course theme mode.
	 */
	public function maybe_override_theme() {

		// Do a cheaper preliminary check first.
		$uri = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
		// phpcs:ignore WordPress.Security.NonceVerification
		if ( ! preg_match( '#' . preg_quote( '/' . self::QUERY_VAR . '/', '#' ) . '#i', $uri ) && ! isset( $_GET[ self::QUERY_VAR ] ) ) {
			return;
		}

		// Then parse the request and make sure the query var is correct.
		wp();

		if ( get_query_var( self::QUERY_VAR ) ) {
			$this->override_theme();
		}
	}

	/**
	 * Load a bundled theme for the request.
	 */
	private function override_theme() {

		add_filter( 'theme_root', [ $this, 'get_plugin_themes_root' ] );
		add_filter( 'template', [ $this, 'theme_template' ] );
		add_filter( 'stylesheet', [ $this, 'theme_stylesheet' ] );
		add_filter( 'theme_root_uri', [ $this, 'theme_root_uri' ] );

		add_filter( 'sensei_use_sensei_template', '__return_false' );
		add_filter( 'template_include', [ $this, 'get_wrapper_template' ] );
		add_filter( 'body_class', [ $this, 'add_sensei_theme_body_class' ] );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_styles' ] );

	}

	/**
	 * Add a route for loading the course theme.
	 *
	 * @access private
	 */
	public function add_rewrite_rules() {
		global $wp;
		$wp->add_query_var( self::QUERY_VAR );
		add_rewrite_rule( '^' . self::QUERY_VAR . '/([^/]*)/([^/]*)/?\??(.*)', 'index.php?' . self::QUERY_VAR . '=1&post_type=$matches[1]&name=$matches[2]&$matches[3]', 'top' );
		add_rewrite_tag( '%' . self::QUERY_VAR . '%', '([^?]+)' );

		if ( ! get_option( 'sensei_course_theme_query_var_flushed' ) ) {
			flush_rewrite_rules( false );
			update_option( 'sensei_course_theme_query_var_flushed', 1 );
		}
	}

	/**
	 * Get course theme name.
	 *
	 * @access private
	 *
	 * @return string
	 */
	public function theme_template() {
		return self::THEME_NAME;
	}

	/**
	 * Get course theme name.
	 *
	 * @access private
	 *
	 * @return string
	 */
	public function theme_stylesheet() {
		return self::THEME_NAME;
	}

	/**
	 * Root URL for bundled themes.
	 *
	 * @access private
	 *
	 * @return string
	 */
	public function theme_root_uri() {
		return Sensei()->plugin_url . '/themes';
	}

	/**
	 * Root directory for bundled themes.
	 *
	 * @access private
	 *
	 * @return string
	 */
	public function get_plugin_themes_root() {
		return Sensei()->plugin_path() . 'themes';
	}

	/**
	 * Directory for course theme.
	 *
	 * @access private
	 *
	 * @return string
	 */
	public function get_course_theme_root() {
		return $this->get_plugin_themes_root() . '/' . self::THEME_NAME;
	}

	/**
	 * Get the wrapper template.
	 *
	 * @access private
	 *
	 * @return string The wrapper template path.
	 */
	public function get_wrapper_template() {
		return locate_template( 'index.php' );
	}


	/**
	 * Add Sensei theme body class.
	 *
	 * @access private
	 *
	 * @param string[] $classes
	 *
	 * @return string[] $classes
	 */
	public function add_sensei_theme_body_class( $classes ) {
		$classes[] = self::THEME_NAME;

		return $classes;
	}

	/**
	 * Enqueue styles.
	 *
	 * @access private
	 */
	public function enqueue_styles() {
		Sensei()->assets->enqueue( self::THEME_NAME . '-style', 'css/sensei-course-theme.css' );
		if ( ! is_admin() ) {
			Sensei()->assets->enqueue( self::THEME_NAME . '-script', 'course-theme/course-theme.js' );
			Sensei()->assets->enqueue_script( 'sensei-blocks-frontend' );
		}
	}

}
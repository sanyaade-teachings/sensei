<?php
/**
 * Sensei Block Patterns.
 *
 * @package sensei-lms
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Sensei Block Patterns class.
 */
class Sensei_Block_Patterns {
	/**
	 * Instance of class.
	 *
	 * @var self
	 */
	private static $instance;

	/**
	 * Fetches the instance of the class.
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
	 * Initializes the class.
	 */
	public function init() {
		add_action( 'init', [ $this, 'register_block_patterns_category' ] );
		add_action( 'current_screen', [ $this, 'register_block_patterns' ] );
		add_action( 'enqueue_block_assets', [ $this, 'enqueue_scripts' ] );
	}

	/**
	 * Sensei_Editor_Wizard constructor. Prevents other instances from being created outside of `self::instance()`.
	 */
	private function __construct() {
	}

	/**
	 * Register Sensei block patterns category.
	 *
	 * @access private
	 */
	public function register_block_patterns_category() {
		register_block_pattern_category(
			self::get_patterns_category_name(),
			[ 'label' => __( 'Sensei LMS', 'sensei-lms' ) ]
		);
	}

	/**
	 * Register block patterns.
	 *
	 * @param WP_Screen $current_screen Current WP_Screen object.
	 *
	 * @access private
	 */
	public function register_block_patterns( $current_screen ) {
		$post_type      = $current_screen->post_type;
		$block_patterns = [];

		if ( 'course' === $post_type ) {
			$block_patterns = [
				'course-default',
				'video-hero',
				'long-sales-page',
			];
		} elseif ( 'lesson' === $post_type ) {
			$block_patterns = [
				'video-lesson',
				'discussion-question',
				'files-to-download',
			];
		}

		foreach ( $block_patterns as $block_pattern ) {
			register_block_pattern(
				'sensei-lms/' . $block_pattern,
				require __DIR__ . "/{$post_type}/{$block_pattern}.php"
			);
		}
	}

	/**
	 * Enqueue scripts.
	 *
	 * @access private
	 */
	public function enqueue_scripts() {
		$post_type  = get_post_type();
		$post_types = [ 'course', 'lesson' ];

		if ( in_array( $post_type, $post_types, true ) ) {
			Sensei()->assets->enqueue( 'sensei-block-patterns-style', 'css/block-patterns.css' );
		}
	}

	/**
	 * Get patterns category name.
	 */
	public static function get_patterns_category_name() {
		return 'sensei-lms';
	}

	/**
	 * Get post content block type name.
	 */
	public static function get_post_content_block_type_name() {
		return 'sensei-lms/post-content';
	}
}

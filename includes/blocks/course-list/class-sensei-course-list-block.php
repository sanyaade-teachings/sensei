<?php
/**
 * File containing extra functionalities of extended Sensei_Course_List_Block class.
 *
 * @package sensei
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Sensei_Course_List_Block
 */
class Sensei_Course_List_Block {

	/**
	 * Sensei_Course_List_Block constructor.
	 */
	public function __construct() {
		add_filter( 'render_block', [ $this, 'render_login_form_if_applicable' ], 10, 2 );
	}

	/**
	 * Replaces content of Course List block when Show Login Form is set and user is logged out.
	 *
	 * @param string $block_content The block content to be rendered.
	 * @param array  $block          The block to be rendered.
	 *
	 * @return string
	 */
	public function render_login_form_if_applicable( $block_content, $block ) {
		if ( 'core/query' !== $block['blockName'] ) {
			return $block_content;
		}

		global $post;

		$is_course_list_block = array_key_exists( 'query', $block['attrs'] ) &&
			'course' === $block['attrs']['query']['postType'] &&
			array_key_exists( 'className', $block['attrs'] ) &&
			false !== strpos( $block['attrs']['className'], 'wp-block-sensei-lms-course-list' );

		$is_my_courses_page = isset( $post ) && is_page() && intval( Sensei()->settings->get( 'my_course_page' ) ) === $post->ID;

		if (
			$is_course_list_block &&
			$is_my_courses_page &&
			! is_user_logged_in()
		) {
			ob_start();
			Sensei()->frontend->sensei_login_form();
			return ob_get_clean();
		}

		return $block_content;
	}
}

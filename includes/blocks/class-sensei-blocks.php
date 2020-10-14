<?php
/**
 * File containing the class Sensei_Blocks.
 *
 * @package sensei
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Sensei_Blocks
 */
class Sensei_Blocks {
	/**
	 * Course outline block.
	 *
	 * @var Sensei_Course_Outline_Block
	 */
	public $course_outline;

	/**
	 * Course progress block.
	 *
	 * @var Sensei_Progress_Bar_Block
	 */
	public $course_progress;

	/**
	 * Course progress block.
	 *
	 * @var Sensei_Contact_Teacher_Block
	 */
	public $contact_teacher;

	/**
	 * Sensei_Blocks constructor .
	 *
	 * @param Sensei_Main $sensei
	 */
	public function __construct( $sensei ) {
		// Skip if Gutenberg is not available.
		if ( ! function_exists( 'register_block_type' ) ) {
			return;
		}

		add_filter( 'block_categories', [ $this, 'sensei_block_categories' ], 10, 2 );

		// Init blocks.
		if ( $sensei->feature_flags->is_enabled( 'course_outline' ) ) {
			$this->course_outline  = new Sensei_Course_Outline_Block();
			$this->course_progress = new Sensei_Progress_Bar_Block();
			$this->contact_teacher = new Sensei_Contact_Teacher_Block();
		}
	}

	/**
	 * Add Sensei LMS block category.
	 *
	 * @access private
	 *
	 * @param array   $categories Current categories.
	 * @param WP_Post $post       Filtered post.
	 *
	 * @return array Filtered categories.
	 */
	public function sensei_block_categories( $categories, $post ) {
		if ( 'course' !== $post->post_type ) {
			return $categories;
		}

		return array_merge(
			$categories,
			[
				[
					'slug'  => 'sensei-lms',
					'title' => __( 'Sensei LMS', 'sensei-lms' ),
					'icon'  => 'wordpress',
				],
			]
		);
	}
}

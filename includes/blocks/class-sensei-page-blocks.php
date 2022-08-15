<?php
/**
 * File containing the class Sensei_Page_Blocks.
 *
 * @package sensei
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Sensei_Page_Blocks
 */
class Sensei_Page_Blocks extends Sensei_Blocks_Initializer {
	/**
	 * Sensei_Page_Blocks constructor.
	 */
	public function __construct() {
		parent::__construct( [ 'page' ] );
	}

	/**
	 * Initialize blocks that are used in page post types.
	 */
	public function initialize_blocks() {
		new Sensei_Block_Take_Course();
		new Sensei_Block_View_Results();
		new Sensei_Continue_Course_Block();
		new Sensei_Course_Completed_Actions_Block();
		new Sensei_Course_Progress_Block();
		new Sensei_Course_Results_Block();
		new Sensei_Learner_Courses_Block();
		new Sensei_Learner_Messages_Button_Block();
	}

	/**
	 * Enqueue frontend and editor assets.
	 *
	 * @access private
	 */
	public function enqueue_block_assets() {

		Sensei()->assets->disable_frontend_styles();
		Sensei()->assets->enqueue(
			'sensei-single-page-blocks-style',
			'blocks/single-page-style.css'
		);
		Sensei()->assets->enqueue(
			'sensei-shared-blocks-style',
			'blocks/shared-style.css'
		);
	}

	/**
	 * Enqueue editor assets.
	 *
	 * @access private
	 */
	public function enqueue_block_editor_assets() {
		Sensei()->assets->enqueue( 'sensei-single-page-blocks', 'blocks/single-page.js', [], true );
		Sensei()->assets->enqueue(
			'sensei-single-page-blocks-editor-style',
			'blocks/single-page-style-editor.css'
		);
	}
}

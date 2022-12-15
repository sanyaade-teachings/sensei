<?php
/**
 * File with class for testing Sensei Guest User Cleaner.
 *
 * @package sensei-tests
 */

/**
 * Class for testing Sensei_Guest_User_Cleaner class.
 *
 * @group Guest User
 */
class Sensei_Guest_User_Cleaner_Test extends WP_UnitTestCase {
	use Sensei_Test_Login_Helpers;

	/**
	 * Factory object.
	 *
	 * @var Sensei_Factory
	 */
	protected $factory;

	/**
	 * Set up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		$this->factory = new Sensei_Factory();
	}

	private function setup_course() {
		$course_data = $this->factory->get_course_with_lessons();
		$course_id   = $course_data['course_id'];
		update_post_meta( $course_id, 'open_access', true );

		global $post, $wp_query;
		$post                  = get_post( $course_id );
		$wp_query->post        = $post;
		$wp_query->is_singular   = true;
		$wp_query->in_the_loop = false;
		echo is_singular( 'course' );
		return $course_data;
	}

	public function testIfAGuestUserIsInactive_WhenCronEventIsFired_OnlyTheInactiveUserGetsRemoved() {

		/* Arrange */
		[ 'course_id' => $course_id ] = $this->setup_course();

		$_POST['course_start']                           = 1;
		$_POST[ 'woothemes_sensei_start_course_noonce' ] = wp_create_nonce( 'woothemes_sensei_start_course_noonce' );
		do_action( 'wp' );
		$this->logout();

		$_POST['course_start']                           = 1;
		$_POST[ 'woothemes_sensei_start_course_noonce' ] = wp_create_nonce( 'woothemes_sensei_start_course_noonce' );
		do_action( 'wp' );

		$user_count_before = Sensei_Utils::get_user_count_for_role( 'guest_student' );

		$comment_id = Sensei_Utils::update_course_status( get_current_user_id(), $course_id, 'complete' );
		update_comment_meta( $comment_id, 'start', '2022-01-01 00:00:01' );

		$activity_args = [
			'user_id' => get_current_user_id(),
			'type_in' => [ 'sensei_lesson_status', 'sensei_course_status' ],
			'status'  => 'any',
			'fields'  => 'ids'
		];

		$activity = Sensei_Utils::sensei_check_for_activity( $activity_args, true );

		wp_update_comment(
			[
				'comment_ID'   => $activity,
				'comment_date' => '2022-01-02 00:00:01',
			]
		);


		/* Act */
		do_action( 'sensei_remove_inactive_guest_users' );

		/* Assert */
		$user_count_later = Sensei_Utils::get_user_count_for_role( 'guest_student' );

		$this->assertEquals( 2, $user_count_before );
		$this->assertEquals( 1, $user_count_later );
	}
}

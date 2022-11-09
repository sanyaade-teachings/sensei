/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, subscribe, select } from '@wordpress/data';
import {
	PanelBody,
	CheckboxControl,
	SelectControl,
	HorizontalRule,
} from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';

import editorLifecycle from '../../shared/helpers/editor-lifecycle';

const CourseGeneralSidebar = () => {
	const course = useSelect( ( select ) => {
		return select( 'core/editor' ).getCurrentPost();
	} );
	const [ author, setAuthor ] = useState( course.author );

	let courses = window.sensei.courseSettingsSidebar.courses;
	if ( courses && courses.length ) {
		courses = courses.map( ( course ) => {
			return { label: course.post_title, value: course.ID };
		} );
		courses.push( { label: __( 'None', 'sensei-lms' ), value: 0 } );
	}

	let teachers = window.sensei.courseSettingsSidebar.teachers;
	if ( teachers && teachers.length ) {
		teachers = teachers.map( ( usr ) => {
			return { label: usr.display_name, value: usr.id };
		} );
	}

	const [ meta, setMeta ] = useEntityProp( 'postType', 'course', 'meta' );
	const featured = meta._course_featured;
	const prerequisite = meta._course_prerequisite;
	const notification = meta.disable_notification;

	useEffect( () =>
		editorLifecycle( {
			onSaveStart: () => {
				if ( author !== course.author ) {
					apiFetch( {
						path: '/sensei-internal/v1/course-utils/update-teacher',
						method: 'PUT',
						data: {
							[ window.sensei.courseSettingsSidebar.nonce_name ]:
								window.sensei.courseSettingsSidebar.nonce_value,
							post_id: course.id,
							teacher: author,
						},
					} );
				}
			},
		} )
	);

	return (
		<PanelBody title={ __( 'General', 'sensei-lms' ) } initialOpen={ true }>
			<h3>{ __( 'Teacher', 'sensei-lms' ) }</h3>
			{ teachers.length ? (
				<SelectControl
					value={ author }
					options={ teachers }
					onChange={ ( new_author ) => setAuthor( new_author ) }
				/>
			) : null }

			<HorizontalRule />

			<h3>{ __( 'Course Prerequisite', 'sensei-lms' ) }</h3>
			{ ! courses.length ? (
				<p>
					{ __(
						'No courses exist yet. Please add some first.',
						'sensei-lms'
					) }
				</p>
			) : null }
			{ courses.length ? (
				<SelectControl
					value={ prerequisite }
					options={ courses }
					onChange={ ( value ) =>
						setMeta( { ...meta, _course_prerequisite: value } )
					}
				/>
			) : null }

			<HorizontalRule />

			<h3>{ __( 'Featured Course', 'sensei-lms' ) }</h3>
			<CheckboxControl
				label={ __( 'Feature this course.', 'sensei-lms' ) }
				checked={ featured === 'featured' }
				onChange={ ( checked ) =>
					setMeta( {
						...meta,
						_course_featured: checked ? 'featured' : '',
					} )
				}
			/>

			<HorizontalRule />

			<h3>{ __( 'Course Notifications', 'sensei-lms' ) }</h3>
			<CheckboxControl
				label={ __(
					'Disable notifications on this course?',
					'sensei-lms'
				) }
				checked={ notification }
				onChange={ ( checked ) =>
					setMeta( { ...meta, disable_notification: checked } )
				}
			/>

			<HorizontalRule />

			<h3>{ __( 'Course Management', 'sensei-lms' ) }</h3>
			<p>
				<a
					href={ `/wp-admin/admin.php?page=sensei_learners&course_id=${ course.id }&view=learners` }
				>
					{ __( 'Manage Students', 'sensei-lms' ) }
				</a>
			</p>
			<p>
				<a
					href={ `/wp-admin/admin.php?page=sensei_grading&course_id=${ course.id }&view=learners` }
				>
					{ __( 'Manage Grading', 'sensei-lms' ) }
				</a>
			</p>
		</PanelBody>
	);
};

export default CourseGeneralSidebar;

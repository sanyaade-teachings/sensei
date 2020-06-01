import { fireEvent, render } from '@testing-library/react';
import { Ready } from './index';

const mockStepData = {
	admin_email: 'admin@test.local',
	mc_url: 'http://external.local/campaign',
	gdpr_field: 'SDCTZX3',
};
jest.mock( '../data/use-setup-wizard-step', () => ( {
	useSetupWizardStep: jest.fn().mockImplementation( () => ( {
		stepData: mockStepData,
	} ) ),
} ) );

describe( '<Ready />', () => {
	beforeEach( () => {
		window.sensei_log_event = jest.fn();
	} );

	afterEach( () => {
		delete window.sensei_log_event;
	} );

	it( 'Should have a sign-up form pointing to the mailing list provider', () => {
		const { container } = render( <Ready /> );

		const form = container.querySelector( 'form' );
		expect( form.getAttribute( 'action' ) ).toEqual( mockStepData.mc_url );
	} );

	it( 'Should have the admin e-mail pre-filled in the sign-up form', () => {
		const { container } = render( <Ready /> );

		const form = container.querySelector( 'form' );
		expect( form.querySelector( 'input[type=email]' ).value ).toEqual(
			mockStepData.admin_email
		);
	} );

	it( 'Should have a create course button', () => {
		const { queryByText } = render( <Ready /> );

		expect(
			queryByText( 'Create a course' ).getAttribute( 'href' )
		).toEqual( 'post-new.php?post_type=course' );
	} );

	it( 'Should have a create your first course link.', () => {
		const { queryByText } = render( <Ready /> );

		expect(
			queryByText( /create your first course/ ).getAttribute( 'href' )
		).toEqual( 'https://senseilms.com/lesson/courses/' );
	} );

	it( 'Should log event when clicking to join mailing list', () => {
		const { queryByText } = render( <Ready /> );
		const button = queryByText( 'Yes, please!' );

		// Temporarily set button type to "button" to prevent form submission.
		button.setAttribute( 'type', 'button' );
		fireEvent.click( button );
		button.setAttribute( 'type', 'submit' );

		expect( window.sensei_log_event ).toHaveBeenCalledWith(
			'setup_wizard_ready_mailing_list',
			undefined
		);
	} );

	it( 'Should log event when clicking "Create a Course" button', () => {
		const { queryByText } = render( <Ready /> );

		fireEvent.click( queryByText( 'Create a course' ) );

		expect( window.sensei_log_event ).toHaveBeenCalledWith(
			'setup_wizard_ready_create_course',
			undefined
		);
	} );

	it( 'Should log event when clicking to learn more', () => {
		const { queryByText } = render( <Ready /> );

		fireEvent.click( queryByText( 'create your first course.' ) );

		expect( window.sensei_log_event ).toHaveBeenCalledWith(
			'setup_wizard_ready_learn_more',
			undefined
		);
	} );
} );

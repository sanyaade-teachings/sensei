const VIDEO_TYPE = 'video';
const VIDEOPRESS_TYPE = 'videopress';
const YOUTUBE_TYPE = 'youtube';
const VIMEO_TYPE = 'vimeo';

const players = {
	[ VIDEO_TYPE ]: {
		/**
		 * Initialize the player.
		 *
		 * @param {HTMLVideoElement} element The player element.
		 *
		 * @return {Promise<HTMLVideoElement>} The video player through a promise.
		 */
		initializePlayer: ( element ) =>
			new Promise( ( resolve ) => {
				// Return that it's ready when it can get the video duration.
				if ( ! isNaN( element.duration ) ) {
					resolve( element );
				}

				element.addEventListener(
					'durationchange',
					() => {
						resolve( element );
					},
					{ once: true }
				);
			} ),

		/**
		 * Get the video duration.
		 *
		 * @param {HTMLVideoElement} player The player element.
		 *
		 * @return {Promise<number>} The duration of the video in seconds through a promise.
		 */
		getDuration: ( player ) =>
			new Promise( ( resolve ) => {
				resolve( player.duration );
			} ),

		/**
		 * Set the video to a current time.
		 *
		 * @param {HTMLVideoElement} player  The player element.
		 * @param {number}           seconds The video time in seconds to set.
		 *
		 * @return {Promise} A promise that resolves if the video was set to a current time successfully.
		 */
		setCurrentTime: ( player, seconds ) =>
			new Promise( ( resolve ) => {
				player.currentTime = seconds;
				resolve();
			} ),

		/**
		 * Play the video.
		 *
		 * @param {HTMLVideoElement} player The player element.
		 *
		 * @return {Promise} The native promise from the video play function.
		 */
		play: ( player ) => player.play(),

		/**
		 * Pause the video.
		 *
		 * @param {HTMLVideoElement} player The player element.
		 *
		 * @return {Promise} A promise that resolves if the video was paused successfully.
		 */
		pause: ( player ) =>
			new Promise( ( resolve, reject ) => {
				player.pause();

				if ( player.paused ) {
					resolve();
				}

				reject( new Error( "Video didn't pause" ) );
			} ),

		/**
		 * Add an timeupdate event listener to the player.
		 *
		 * @param {HTMLVideoElement} player   The player element.
		 * @param {Function}         callback Listener callback.
		 *
		 * @return {Function} The function to unsubscribe the event.
		 */
		onTimeupdate: ( player, callback ) => {
			const transformedCallback = ( event ) => {
				callback( event.target.currentTime );
			};

			player.addEventListener( 'timeupdate', transformedCallback );

			return () => {
				player.removeEventListener( 'timeupdate', transformedCallback );
			};
		},
	},
	[ VIDEOPRESS_TYPE ]: {
		/**
		 * The embed pattern to check if it's the respective type.
		 */
		embedPattern: /(videopress|video\.wordpress)\.com\/.+/i,

		/**
		 * Initialize the player.
		 *
		 * @param {HTMLIFrameElement} element The player element.
		 * @param {Window}            w       A custom window.
		 *
		 * @return {Promise<HTMLIFrameElement>} The video player through a promise.
		 */
		initializePlayer: ( element, w = window ) =>
			new Promise( ( resolve ) => {
				const onDurationChange = ( event ) => {
					if (
						event.source !== element.contentWindow ||
						event.data.event !== 'videopress_durationchange' ||
						! event.data.durationMs
					) {
						return;
					}

					// Set the duration to a dataset in order to have it available for later.
					element.dataset.duration =
						parseInt( event.data.durationMs, 10 ) / 1000;

					w.removeEventListener( 'message', onDurationChange );
					resolve( element );
				};

				// eslint-disable-next-line @wordpress/no-global-event-listener -- Not in a React context.
				w.addEventListener( 'message', onDurationChange );
			} ),

		/**
		 * Get the video duration.
		 *
		 * @param {HTMLIFrameElement} player The player element.
		 *
		 * @return {Promise<number>} The duration of the video in seconds through a promise.
		 */
		getDuration: ( player ) =>
			new Promise( ( resolve, reject ) => {
				const { duration } = player.dataset;

				if ( ! duration ) {
					reject( new Error( 'Video duration not found' ) );
				}

				resolve( parseFloat( player.dataset.duration ) );
			} ),

		/**
		 * Set the video to a current time.
		 *
		 * @param {HTMLIFrameElement} player  The player element.
		 * @param {number}            seconds The video time in seconds to set.
		 *
		 * @return {Promise} A promise that resolves if the video was set to a current time successfully.
		 */
		setCurrentTime: ( player, seconds ) =>
			new Promise( ( resolve ) => {
				player.contentWindow.postMessage(
					{
						event: 'videopress_action_set_currenttime',
						currentTime: seconds,
					},
					'*'
				);
				resolve();
			} ),

		/**
		 * Play the video.
		 *
		 * @param {HTMLIFrameElement} player The player element.
		 *
		 * @return {Promise} A promise that resolves if the video play was sent successfully.
		 */
		play: ( player ) =>
			new Promise( ( resolve ) => {
				player.contentWindow.postMessage(
					{ event: 'videopress_action_play' },
					'*'
				);
				resolve();
			} ),

		/**
		 * Pause the video.
		 *
		 * @param {HTMLIFrameElement} player The player element.
		 *
		 * @return {Promise} A promise that resolves if the video pause was sent successfully.
		 */
		pause: ( player ) =>
			new Promise( ( resolve ) => {
				player.contentWindow.postMessage(
					{ event: 'videopress_action_pause' },
					'*'
				);
				resolve();
			} ),

		/**
		 * Add an timeupdate event listener to the player.
		 *
		 * @param {HTMLIFrameElement} player   The player element.
		 * @param {Function}          callback Listener callback.
		 * @param {Window}            w        A custom window.
		 *
		 * @return {Function} The function to unsubscribe the event.
		 */
		onTimeupdate: ( player, callback, w = window ) => {
			const transformedCallback = ( event ) => {
				if (
					event.source !== player.contentWindow ||
					event.data.event !== `videopress_timeupdate` ||
					! event.data.currentTimeMs
				) {
					return;
				}

				callback( event.data.currentTimeMs / 1000 );
			};

			// eslint-disable-next-line @wordpress/no-global-event-listener -- Not in a React context.
			w.addEventListener( 'message', transformedCallback );

			return () => {
				// eslint-disable-next-line @wordpress/no-global-event-listener -- Not in a React context.
				w.removeEventListener( 'message', transformedCallback );
			};
		},
	},
	[ YOUTUBE_TYPE ]: {
		/**
		 * The embed pattern to check if it's the respective type.
		 */
		embedPattern: /(youtu\.be|youtube\.com)\/.+/i,

		/**
		 * Initialize the player.
		 *
		 * @param {HTMLIFrameElement} element The player element.
		 * @param {Window}            w       A custom window.
		 *
		 * @return {Object} The YouTube player instance through a promise.
		 */
		initializePlayer: ( element, w = window ) =>
			new Promise( ( resolve ) => {
				w.senseiYouTubeIframeAPIReady.then( () => {
					const player =
						w.YT.get( element.id ) || new w.YT.Player( element );

					const onReady = () => {
						resolve( player );
					};

					if ( player.getDuration ) {
						// Just in case it's called after the player is ready.
						onReady();
					} else {
						player.addEventListener( 'onReady', onReady );
					}
				} );
			} ),

		/**
		 * Get the video duration.
		 *
		 * @param {Object} player The YouTube player instance.
		 *
		 * @return {Promise<number>} The duration of the video in seconds through a promise.
		 */
		getDuration: ( player ) =>
			new Promise( ( resolve ) => {
				resolve( player.getDuration() );
			} ),

		/**
		 * Set the video to a current time.
		 *
		 * @param {Object} player  The YouTube player instance.
		 * @param {number} seconds The video time in seconds to set.
		 *
		 * @return {Promise} A promise that resolves if the video was set to a current time successfully.
		 */
		setCurrentTime: ( player, seconds ) =>
			new Promise( ( resolve ) => {
				player.seekTo( seconds );
				resolve();
			} ),

		/**
		 * Play the video.
		 *
		 * @param {Object} player The YouTube player instance.
		 *
		 * @return {Promise} A promise that resolves if the video play was called successfully.
		 */
		play: ( player ) =>
			new Promise( ( resolve ) => {
				player.playVideo();
				resolve();
			} ),

		/**
		 * Pause the video.
		 *
		 * @param {Object} player The YouTube player instance.
		 *
		 * @return {Promise} A promise that resolves if the video pause was called successfully.
		 */
		pause: ( player ) =>
			new Promise( ( resolve ) => {
				player.pauseVideo();
				resolve();
			} ),

		/**
		 * Add an timeupdate event listener to the player.
		 *
		 * @param {Object}   player   The YouTube player instance.
		 * @param {Function} callback Listener callback.
		 * @param {Window}   w        A custom window.
		 *
		 * @return {Function} The function to unsubscribe the event.
		 */
		onTimeupdate: ( player, callback, w = window ) => {
			const timer = 250;

			const interval = setInterval( () => {
				if ( player.getPlayerState() === w.YT.PlayerState.PLAYING ) {
					callback( player.getCurrentTime() );
				}
			}, timer );

			return () => {
				clearInterval( interval );
			};
		},
	},
	[ VIMEO_TYPE ]: {
		/**
		 * The embed pattern to check if it's the respective type.
		 */
		embedPattern: /vimeo\.com\/.+/i,

		/**
		 * Initialize the player.
		 *
		 * @param {HTMLIFrameElement} element The player element.
		 * @param {Window}            w       A custom window.
		 *
		 * @return {Object} The Vimeo player instance through a promise.
		 */
		initializePlayer: ( element, w = window ) =>
			Promise.resolve( new w.Vimeo.Player( element ) ),

		/**
		 * Get the video duration.
		 *
		 * @param {Object} player The Vimeo player instance.
		 *
		 * @return {Promise<number>} The duration of the video in seconds through a promise
		 *                           (original return from Vimeo API).
		 */
		getDuration: ( player ) => player.getDuration(),

		/**
		 * Set the video to a current time.
		 *
		 * @param {Object} player  The Vimeo player instance.
		 * @param {number} seconds The video time in seconds to set.
		 *
		 * @return {Promise} A promise that resolves if the video was set to a current time successfully.
		 *                   (original return from Vimeo API).
		 */
		setCurrentTime: ( player, seconds ) => player.setCurrentTime( seconds ),

		/**
		 * Play the video.
		 *
		 * @param {Object} player The Vimeo player instance.
		 *
		 * @return {Promise} A promise that resolves if the video was played successfully.
		 *                   (original return from Vimeo API).
		 */
		play: ( player ) => player.play(),

		/**
		 * Pause the video.
		 *
		 * @param {Object} player The Vimeo player instance.
		 *
		 * @return {Promise} A promise that resolves if the video was paused successfully.
		 *                   (original return from Vimeo API).
		 */
		pause: ( player ) => player.pause(),

		/**
		 * Add an timeupdate event listener to the player.
		 *
		 * @param {Object}   player   The Vimeo player instance.
		 * @param {Function} callback Listener callback.
		 *
		 * @return {Function} The function to unsubscribe the event.
		 */
		onTimeupdate: ( player, callback ) => {
			const transformedCallback = ( event ) => {
				callback( event.seconds );
			};

			player.on( 'timeupdate', transformedCallback );

			return () => {
				player.off( 'timeupdate', transformedCallback );
			};
		},
	},
};

/**
 * A class that abstracts the use of the player APIs: Video, VideoPress, YouTube, and Vimeo.
 */
class Player {
	/**
	 * Player constructor.
	 *
	 * @param {HTMLVideoElement|HTMLIFrameElement} element The player element.
	 * @param {Window}                             w       A custom window.
	 */
	constructor( element, w = window ) {
		this.playerPromise = null;
		this.type = null;
		this.element = element;
		this.w = w;

		try {
			this.setType();
		} catch ( e ) {
			// eslint-disable-next-line no-console -- We want to expose the element with problem.
			console.error( e, element );
		}
	}

	/**
	 * Set the player type.
	 *
	 * @throws Will throw an error if the video type is not found.
	 */
	setType() {
		if ( this.element instanceof this.w.HTMLVideoElement ) {
			this.type = VIDEO_TYPE;
		} else if ( this.element instanceof this.w.HTMLIFrameElement ) {
			this.type = Object.entries( players ).find(
				( [ , p ] ) =>
					p.embedPattern && this.element.src?.match( p.embedPattern )
			)?.[ 0 ];
		}

		if ( ! this.type ) {
			throw new Error( 'Video type not found' );
		}
	}

	/**
	 * Get the video player.
	 *
	 * @return {Promise<Object|HTMLVideoElement|HTMLIFrameElement>} The video player through a promise.
	 */
	getPlayer() {
		if ( ! this.playerPromise ) {
			this.playerPromise =
				players[ this.type ]?.initializePlayer(
					this.element,
					this.w
				) ||
				// A promise that never resolves if it doesn't exist.
				Promise.reject( new Error( 'Failed getting the player' ) );
		}

		return this.playerPromise;
	}

	/**
	 * Get the video duration.
	 *
	 * @return {Promise<number>} The duration of the video in seconds through a promise.
	 */
	getDuration() {
		return this.getPlayer().then( ( player ) =>
			players[ this.type ].getDuration( player )
		);
	}

	/**
	 * Set the video to a current time.
	 *
	 * @param {number} seconds The video time in seconds to set.
	 *
	 * @return {Promise} A promise that resolves if the video was set to a current time successfully.
	 */
	setCurrentTime( seconds ) {
		return this.getPlayer().then( ( player ) =>
			players[ this.type ].setCurrentTime( player, seconds )
		);
	}

	/**
	 * Play the video.
	 *
	 * @return {Promise} A promise that resolves if the video play was called successfully.
	 */
	play() {
		return this.getPlayer().then( ( player ) =>
			players[ this.type ].play( player )
		);
	}

	/**
	 * Pause the video.
	 *
	 * @return {Promise} A promise that resolves if the video pause was called successfully.
	 */
	pause() {
		return this.getPlayer().then( ( player ) =>
			players[ this.type ].pause( player )
		);
	}

	/**
	 * Add an event listener to the player.
	 *
	 * @param {string}   eventName Event name (supported: `timeupdate`).
	 * @param {Function} callback  Listener callback.
	 *
	 * @throws Will throw an error if the event is not supported.
	 *
	 * @return {Promise<Function>} The function to unsubscribe the event through a promise.
	 */
	on( eventName, callback ) {
		// Check supported events.
		if ( eventName !== 'timeupdate' ) {
			throw new Error( `Event ${ eventName } not supported` );
		}

		return this.getPlayer().then( ( player ) =>
			players[ this.type ].onTimeupdate( player, callback, this.w )
		);
	}
}

export default Player;

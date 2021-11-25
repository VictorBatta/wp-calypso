import { isMobile } from '@automattic/viewport';
import { includes } from 'lodash';
import {
	APP_BANNER_DISMISS_TIMES_PREFERENCE,
	ALLOWED_SECTIONS,
	isDismissed,
	getCurrentSection,
} from 'calypso/blocks/app-banner/utils';
import { isWpMobileApp } from 'calypso/lib/mobile-app';
import { getPreference, isFetchingPreferences } from 'calypso/state/preferences/selectors';
import isNotificationsOpen from 'calypso/state/selectors/is-notifications-open';
import { shouldDisplayTosUpdateBanner } from 'calypso/state/selectors/should-display-tos-update-banner';
import { getSectionName, appBannerIsEnabled } from 'calypso/state/ui/selectors';
import { AppState } from 'calypso/types';

/**
 * Returns true if the App Banner has been dismissed
 *
 * @param {object} state Global state tree
 * @returns {boolean} True if App Banner has been dismissed
 */
export default function isAppBannerVisible( state: AppState ): boolean | null {
	// The ToS update banner is displayed in the same position as the mobile app banner. Since the ToS update
	// has higher priority, we repress all other non-essential sticky banners if the ToS update banner needs to
	// be displayed.
	if ( shouldDisplayTosUpdateBanner( state ) ) {
		return false;
	}

	// In some cases such as error we want to hide the app banner completely.
	if ( ! appBannerIsEnabled( state ) ) {
		return false;
	}

	if ( isFetchingPreferences( state ) ) {
		return false;
	}

	const sectionName = getSectionName( state );
	const isNotesOpen = isNotificationsOpen( state );
	const currentSection = getCurrentSection( sectionName, isNotesOpen );

	if ( ! includes( ALLOWED_SECTIONS, currentSection ) ) {
		return null;
	}

	const dismissedUntil = getPreference( state, APP_BANNER_DISMISS_TIMES_PREFERENCE );

	const dismissed = isDismissed( dismissedUntil, currentSection );

	return isMobile() && ! isWpMobileApp() && ! dismissed;
}

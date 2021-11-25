import { Card, Button } from '@automattic/components';
import { ToggleControl } from '@wordpress/components';
import { sprintf } from '@wordpress/i18n';
import { Icon, lock } from '@wordpress/icons';
import { useI18n } from '@wordpress/react-i18n';
import { connect } from 'react-redux';
import ActionCard from 'calypso/components/action-card';
import CardHeading from 'calypso/components/card-heading';
import FormattedHeader from 'calypso/components/formatted-header';
import Main from 'calypso/components/main';
import BodySectionCssClass from 'calypso/layout/body-section-css-class';
import { getSelectedDomain, isMappedDomain } from 'calypso/lib/domains';
import Breadcrumbs from 'calypso/my-sites/domains/domain-management/components/breadcrumbs';
import {
	domainManagementEdit,
	domainManagementList,
	domainManagementTransferToAnotherUser,
	domainManagementTransferToOtherSite,
} from 'calypso/my-sites/domains/paths';
import {
	lockDomain,
	unlockDomain,
	requestDomainTransferCodeOnly,
} from 'calypso/state/domains/transfer/actions';
import { getDomainWapiInfoByDomainName } from 'calypso/state/domains/transfer/selectors';
import getCurrentRoute from 'calypso/state/selectors/get-current-route';
import getPrimaryDomainBySiteId from 'calypso/state/selectors/get-primary-domain-by-site-id';
import isDomainOnlySite from 'calypso/state/selectors/is-domain-only-site';
import isPrimaryDomainBySiteId from 'calypso/state/selectors/is-primary-domain-by-site-id';
import isSiteAutomatedTransfer from 'calypso/state/selectors/is-site-automated-transfer';
import { hasLoadedSiteDomains } from 'calypso/state/sites/domains/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import type { TransferPageProps } from './types';

import './style.scss';

const TransferPage = ( props: TransferPageProps ): JSX.Element => {
	const { __ } = useI18n();
	const {
		currentRoute,
		isAtomic,
		isCancelingTransfer,
		isDomainOnly,
		isLoading,
		isMapping,
		isPrimaryDomain,
		isRequestingTransferCode,
		lockDomain,
		locked,
		requestDomainTransferCodeOnly,
		selectedDomainName,
		selectedSite,
		unlockDomain,
	} = props;

	const renderBreadcrumbs = () => {
		const items = [
			{
				// translators: Internet domains, e.g. mygroovydomain.com
				label: __( 'Domains' ),
				href: domainManagementList( selectedSite.slug, selectedDomainName ),
			},
			{
				label: selectedDomainName,
				href: domainManagementEdit( selectedSite.slug, selectedDomainName, currentRoute ),
			},
			{
				// translators: Verb - Transfer a domain somewhere else
				label: __( 'Transfer' ),
			},
		];

		const mobileItem = {
			label: sprintf(
				/* translators: Link to return to the settings management page of a specific domain (%s = domain, e.g. example.com) */
				__( 'Back to %s' ),
				selectedDomainName
			),
			href: domainManagementEdit( selectedSite.slug, selectedDomainName, currentRoute ),
			showBackArrow: true,
		};

		return <Breadcrumbs items={ items } mobileItem={ mobileItem } />;
	};

	const renderTransferOptions = () => {
		const options = [];

		if ( ! isDomainOnly ) {
			const mainText = isMapping
				? __( 'Transfer this domain connection to any administrator on this site' )
				: __( 'Transfer this domain to any administrator on this site' );

			options.push(
				<ActionCard
					key="transfer-to-another-user"
					buttonHref={ domainManagementTransferToAnotherUser(
						selectedSite.slug,
						selectedDomainName,
						currentRoute
					) }
					// translators: Continue is a verb
					buttonText={ __( 'Continue' ) }
					// translators: Transfer a domain to another user
					headerText={ __( 'To another user' ) }
					mainText={ mainText }
				/>
			);
		}

		if ( ! ( isPrimaryDomain && isAtomic ) ) {
			if ( options.length > 0 ) {
				options.push( <div key="separator" className="transfer-page__item-separator"></div> );
			}
			const mainText = isMapping
				? __( 'Transfer this domain connection to any site you are an administrator on' )
				: __( 'Transfer this domain to any site you are an administrator on' );

			options.push(
				<ActionCard
					key="transfer-to-another-site"
					buttonHref={ domainManagementTransferToOtherSite(
						selectedSite.slug,
						selectedDomainName,
						currentRoute
					) }
					// translators: Continue is a verb
					buttonText={ __( 'Continue' ) }
					// translators: Transfer a domain to another WordPress.com site
					headerText={ __( 'To another WordPress.com site' ) }
					mainText={ mainText }
				/>
			);
		}

		return options.length > 0 ? <Card>{ options }</Card> : null;
	};

	const unlockDomainHandler = () => {
		const options = {
			siteId: selectedSite.ID,
			unlock: true,
		};
		unlockDomain( selectedDomainName, options );
	};

	const lockDomainHandler = () => {
		const { pendingTransfer, domainLockingAvailable } = getSelectedDomain( props );

		lockDomain( selectedDomainName, {
			declineTransfer: pendingTransfer,
			siteId: selectedSite.ID,
			lockDomain: domainLockingAvailable,
		} );
	};

	const requestTransferCode = () => {
		requestDomainTransferCodeOnly( selectedDomainName );
	};

	const renderAdvancedTransferOptions = () => {
		// translators: domain transfer lock
		const disabledLockLabel = __( 'Transfer lock off' );
		// translators: domain transfer lock
		const enabledLockLabel = __( 'Transfer lock on' );

		const toggleLabel = isLoading ? (
			'loading'
		) : (
			<span className="transfer-page__transfer-lock-label">
				{ locked ? (
					<>
						<Icon icon={ lock } size={ 15 } viewBox="4 0 18 20" />
						{ enabledLockLabel }
					</>
				) : (
					disabledLockLabel
				) }
			</span>
		);

		return (
			<Card>
				<CardHeading size={ 16 } isBold={ true }>
					Advanced Options
				</CardHeading>
				<ToggleControl
					checked={ locked }
					disabled={ isRequestingTransferCode || isCancelingTransfer }
					onChange={ locked ? unlockDomainHandler : lockDomainHandler }
					label={ toggleLabel }
				/>
				<p>
					{ __(
						'We recommend leaving the transfer lock on, unless you want to transfer your domain to another provider.'
					) }
				</p>
				<Button
					primary={ false }
					busy={ isRequestingTransferCode || isCancelingTransfer }
					onClick={ requestTransferCode }
				>
					{ __( 'Get authorization code' ) }
				</Button>
			</Card>
		);
	};

	return (
		<Main className="transfer-page" wideLayout>
			<BodySectionCssClass bodyClass={ [ 'edit__body-white' ] } />
			{ renderBreadcrumbs() }
			<FormattedHeader brandFont headerText={ __( 'Transfer' ) } align="left" />
			{ renderTransferOptions() }
			{ renderAdvancedTransferOptions() }
		</Main>
	);
};

const transferPageComponent = connect(
	( state, ownProps: TransferPageProps ) => {
		const domain = getSelectedDomain( ownProps );
		const siteId = getSelectedSiteId( state )!;
		const domainInfo = getDomainWapiInfoByDomainName( state, ownProps.selectedDomainName );
		return {
			isLoading: false, // ! domainInfo.hasLoadedFromServer,
			domain,
			currentRoute: getCurrentRoute( state ),
			hasSiteDomainsLoaded: hasLoadedSiteDomains( state, siteId ),
			isAtomic: isSiteAutomatedTransfer( state, siteId ),
			isDomainOnly: isDomainOnlySite( state, siteId ),
			isMapping: Boolean( domain ) && isMappedDomain( domain ),
			isPrimaryDomain: isPrimaryDomainBySiteId( state, siteId, ownProps.selectedDomainName ),
			primaryDomain: getPrimaryDomainBySiteId( state, siteId ),
			isRequestingTransferCode: !! domainInfo.isRequestingTransferCode,
			isCancelingTransfer: !! domainInfo.isCancelingTransfer,
			isDomainPendingTransfer: !! domainInfo.data?.pendingTransfer,
			locked: domainInfo.data?.locked,
		};
	},
	{
		lockDomain,
		requestDomainTransferCodeOnly,
		unlockDomain,
	}
)( TransferPage );

export default transferPageComponent;

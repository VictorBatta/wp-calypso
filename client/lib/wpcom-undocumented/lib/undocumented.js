import debugFactory from 'debug';
import { omit } from 'lodash';
import readerContentWidth from 'calypso/reader/lib/content-width';

const debug = debugFactory( 'calypso:wpcom-undocumented:undocumented' );
const { Blob } = globalThis; // The linter complains if I don't do this...?

/**
 * Create an `Undocumented` instance
 *
 * @param {object} wpcom - The request handler
 * @returns {Undocumented} - An instance of Undocumented
 */
function Undocumented( wpcom ) {
	if ( ! ( this instanceof Undocumented ) ) {
		return new Undocumented( wpcom );
	}
	this.wpcom = wpcom;
}

Undocumented.prototype.jetpackIsUserConnected = function ( siteId ) {
	debug( '/sites/:site_id:/jetpack-connect/is-user-connected query' );
	const endpointUrl = '/sites/' + siteId + '/jetpack-connect/is-user-connected';
	return this.wpcom.req.get( { path: endpointUrl, apiNamespace: 'wpcom/v2' } );
};

/**
 * GET/POST site settings
 *
 * @param {number|string} [siteId] The site ID
 * @param {string} [method] The request method
 * @param {object} [data] The POST data
 * @param {Function} fn The callback function
 */
Undocumented.prototype.settings = function ( siteId, method = 'get', data = {}, fn ) {
	debug( '/sites/:site_id:/settings query' );
	if ( 'function' === typeof method ) {
		fn = method;
		method = 'get';
		data = {};
	}

	// If no apiVersion was specified, use the settings api version with the widest support (1.1)
	const apiVersion = data.apiVersion || '1.1';
	const body = omit( data, [ 'apiVersion' ] );
	const path = '/sites/' + siteId + '/settings';

	if ( 'get' === method ) {
		return this.wpcom.req.get( path, { apiVersion }, fn );
	}

	return this.wpcom.req.post( { path }, { apiVersion }, body, fn );
};

/**
 * Get the inbound transfer status for this domain
 *
 * @param {string} domain - The domain name to check.
 * @param {string} authCode - The auth code for the given domain to check.
 * @param {Function} fn The callback function
 * @returns {Promise} A promise that resolves when the request completes
 */
Undocumented.prototype.checkAuthCode = function ( domain, authCode, fn ) {
	return this.wpcom.req.get(
		`/domains/${ encodeURIComponent( domain ) }/inbound-transfer-check-auth-code`,
		{ auth_code: authCode },
		fn
	);
};

/**
 * Get the inbound transfer status for this domain
 *
 * @param {string} domain - The domain name to check.
 * @param {Function} fn The callback function
 * @returns {Promise} A promise that resolves when the request completes
 */
Undocumented.prototype.getInboundTransferStatus = function ( domain, fn ) {
	return this.wpcom.req.get(
		{
			path: `/domains/${ encodeURIComponent( domain ) }/inbound-transfer-status`,
		},
		fn
	);
};

/**
 * Starts an inbound domain transfer that is in the pending_start state.
 *
 * @param {number|string} siteId The site ID
 * @param {string} domain The domain name
 * @param {string} authCode The auth code for the transfer
 * @param {Function} fn The callback function
 * @returns {Promise} A promise that resolves when the request completes
 */
Undocumented.prototype.startInboundTransfer = function ( siteId, domain, authCode, fn ) {
	let query = {};
	if ( authCode && authCode !== '' ) {
		query = { auth_code: authCode };
	}

	return this.wpcom.req.get(
		`/domains/${ encodeURIComponent( domain ) }/inbound-transfer-start/${ siteId }`,
		query,
		fn
	);
};

/**
 *
 * @param domain {string}
 * @param fn {function}
 */
Undocumented.prototype.getDomainPrice = function ( domain, fn ) {
	return this.wpcom.req.get(
		`/domains/${ encodeURIComponent( domain ) }/price`,
		{
			apiVersion: '1.1',
		},
		fn
	);
};

function addReaderContentWidth( params ) {
	if ( params.content_width ) {
		return;
	}
	const contentWidth = readerContentWidth();
	if ( contentWidth ) {
		params.content_width = contentWidth;
	}
}

Undocumented.prototype.readFeedPost = function ( query, fn ) {
	const params = omit( query, [ 'feedId', 'postId' ] );
	debug( '/read/feed/' + query.feedId + '/posts/' + query.postId );
	params.apiVersion = '1.2';
	addReaderContentWidth( params );

	return this.wpcom.req.get(
		'/read/feed/' +
			encodeURIComponent( query.feedId ) +
			'/posts/' +
			encodeURIComponent( query.postId ),
		params,
		fn
	);
};

Undocumented.prototype.readSitePost = function ( query, fn ) {
	const params = omit( query, [ 'site', 'postId' ] );
	debug( '/read/sites/:site/post/:post' );
	addReaderContentWidth( params );
	return this.wpcom.req.get( '/read/sites/' + query.site + '/posts/' + query.postId, params, fn );
};

/**
 * Launches a private site
 *
 * @param {string} siteIdOrSlug - ID or slug of the site to be launched
 * @param {Function} fn - Function to invoke when request is complete
 */
Undocumented.prototype.launchSite = function ( siteIdOrSlug, fn ) {
	const path = `/sites/${ siteIdOrSlug }/launch`;
	debug( path );
	return this.wpcom.req.post( path, fn );
};

Undocumented.prototype.resendIcannVerification = function ( domain, callback ) {
	return this.wpcom.req.post( '/domains/' + domain + '/resend-icann/', callback );
};

Undocumented.prototype.fetchDns = function ( domainName, fn ) {
	return this.wpcom.req.get( '/domains/' + domainName + '/dns', fn );
};

Undocumented.prototype.updateDns = function ( domain, records, fn ) {
	const body = { dns: JSON.stringify( records ) };

	return this.wpcom.req.post( '/domains/' + domain + '/dns', body, fn );
};

Undocumented.prototype.applyDnsTemplate = function (
	domain,
	provider,
	service,
	variables,
	callback
) {
	return this.wpcom.req.post(
		'/domains/' + domain + '/dns/providers/' + provider + '/services/' + service,
		{ variables },
		callback
	);
};

Undocumented.prototype.applyDnsTemplateSyncFlow = function (
	domain,
	provider,
	service,
	variables,
	callback
) {
	return this.wpcom.req.get(
		'/domain-connect/authorize/v2/domainTemplates/providers/' +
			provider +
			'/services/' +
			service +
			'/apply/authorized',
		Object.assign( {}, { apiVersion: '1.3' }, variables ),
		callback
	);
};

Undocumented.prototype.getDnsTemplateRecords = function (
	domain,
	provider,
	service,
	variables,
	callback
) {
	return this.wpcom.req.post(
		'/domains/' + domain + '/dns/providers/' + provider + '/services/' + service + '/preview',
		{ variables },
		callback
	);
};

Undocumented.prototype.transferToUser = function ( siteId, domainName, targetUserId, fn ) {
	return this.wpcom.req.post(
		'/sites/' + siteId + '/domains/' + domainName + '/transfer-to-user/' + targetUserId,
		fn
	);
};

/**
 * Transfers a domain to the specified site
 *
 * @param {number} siteId The site ID
 * @param {string} [domainName] Name of the domain
 * @param {number} [targetSiteId] The target site ID
 * @param {Function} fn The callback function
 * @returns {Promise} A promise that resolves when the request completes
 */
Undocumented.prototype.transferToSite = function ( siteId, domainName, targetSiteId, fn ) {
	return this.wpcom.req.post(
		`/sites/${ siteId }/domains/${ domainName }/transfer-to-site/${ targetSiteId }`,
		fn
	);
};

/*
 * Change the theme of a given site.
 *
 * @param {string} [siteSlug]
 * @param {string} [data]
 * @param {Function} fn
 */
Undocumented.prototype.changeTheme = function ( siteSlug, data, fn ) {
	debug( '/site/:site_id/themes/mine' );
	return this.wpcom.req.post(
		{
			path: '/sites/' + siteSlug + '/themes/mine',
			body: data,
		},
		fn
	);
};

Undocumented.prototype.isSiteImportable = function ( site_url ) {
	debug( `/wpcom/v2/imports/is-site-importable?${ site_url }` );

	return this.wpcom.req.get(
		{ path: '/imports/is-site-importable', apiNamespace: 'wpcom/v2' },
		{ site_url }
	);
};

/**
 * Check different info about WordPress and Jetpack status on a url
 *
 * @param  {string}  inputUrl The url of the site to check. Must use http or https protocol.
 * @returns {Promise} promise  Request promise
 */
Undocumented.prototype.getSiteConnectInfo = function ( inputUrl ) {
	return this.wpcom.req.get( '/connect/site-info', { url: inputUrl } );
};

/**
 * Imports given XML file into the user's Reader feed.
 * XML file is expected to be in OPML format.
 *
 * @param {globalThis.File}     file         The File object to upload
 * @param {Function} fn           The callback function
 * @returns {globalThis.XMLHttpRequest} The XHR instance, to attach `progress`
 *   listeners to, etc.
 */
Undocumented.prototype.importReaderFeed = function ( file, fn ) {
	debug( '/read/following/mine/import' );
	const params = {
		path: '/read/following/mine/import',
		formData: [ [ 'import', file ] ],
	};
	// XXX: kind strange, wpcom.js, that `apiVersion` must be in `query`
	// *and* pass a `body` of null for this to work properly…
	const query = {
		apiVersion: '1.2',
	};
	return this.wpcom.req.post( params, query, null, fn );
};

/**
 * Requests streamlined approval to WordAds program
 *
 * @param {number}       siteId            The site ID
 * @returns {Promise} A promise representing the request
 */
Undocumented.prototype.wordAdsApprove = function ( siteId ) {
	debug( '/sites/:site:/wordads/approve' );
	return this.wpcom.req.post( '/sites/' + siteId + '/wordads/approve' );
};

/**
 * Fetch the status of an Automated Transfer.
 *
 * @param {number} siteId -- the ID of the site being transferred
 * @param {number} transferId -- ID of the specific transfer
 * @returns {Promise} promise for handling result
 */
Undocumented.prototype.transferStatus = function ( siteId, transferId ) {
	debug( '/sites/:site_id/automated-transfers/status/:transfer_id' );
	return this.wpcom.req.get( {
		path: `/sites/${ siteId }/automated-transfers/status/${ transferId }`,
	} );
};

/**
 * Get OAuth2 Client data for a given client ID
 *
 * @param {string}     clientId       The client ID
 * @param {Function}   fn             The callback function
 * @returns {Promise} A promise representing the request.
 */
Undocumented.prototype.oauth2ClientId = function ( clientId, fn ) {
	return this.wpcom.req.get(
		`/oauth2/client-data/${ clientId }`,
		{ apiNamespace: 'wpcom/v2' },
		fn
	);
};

Undocumented.prototype.getDomainConnectSyncUxUrl = function (
	domain,
	providerId,
	serviceId,
	redirectUri,
	callback
) {
	return this.wpcom.req.get(
		`/domains/${ domain }/dns/providers/${ providerId }/services/${ serviceId }/syncurl`,
		{ redirect_uri: redirectUri },
		callback
	);
};

Undocumented.prototype.domainsVerifyRegistrantEmail = function ( domain, email, token ) {
	return this.wpcom.req.get( `/domains/${ domain }/verify-email`, { email, token } );
};

Undocumented.prototype.domainsVerifyOutboundTransferConfirmation = function (
	domain,
	recipientId,
	token,
	command
) {
	return this.wpcom.req.get( `/domains/${ domain }/outbound-transfer-confirmation-check`, {
		recipient_id: recipientId,
		token,
		command,
	} );
};

Undocumented.prototype.getMigrationStatus = function ( targetSiteId ) {
	return this.wpcom.req.get( {
		path: `/sites/${ targetSiteId }/migration-status`,
		apiNamespace: 'wpcom/v2',
	} );
};

Undocumented.prototype.resetMigration = function ( targetSiteId ) {
	return this.wpcom.req.post( {
		path: `/sites/${ targetSiteId }/reset-migration`,
		apiNamespace: 'wpcom/v2',
	} );
};

Undocumented.prototype.startMigration = function ( sourceSiteId, targetSiteId ) {
	return this.wpcom.req.post( {
		path: `/sites/${ targetSiteId }/migrate-from/${ sourceSiteId }`,
		apiNamespace: 'wpcom/v2',
	} );
};

Undocumented.prototype.getAtomicSiteMediaViaProxy = function (
	siteIdOrSlug,
	mediaPath,
	{ query = '', maxSize }
) {
	const safeQuery = query.replace( /^\?/, '' );
	const params = {
		path: `/sites/${ siteIdOrSlug }/atomic-auth-proxy/file?path=${ mediaPath }&${ safeQuery }`,
		apiNamespace: 'wpcom/v2',
	};

	return new Promise( ( resolve, _reject ) => {
		const fetchMedia = () =>
			this.wpcom.req.get( { ...params, responseType: 'blob' }, ( error, data ) => {
				if ( error || ! ( data instanceof Blob ) ) {
					_reject( error );
				} else {
					resolve( data );
				}
			} );

		if ( ! maxSize ) {
			return fetchMedia();
		}

		return this.wpcom.req.get( { ...params, method: 'HEAD' }, ( err, data, headers ) => {
			if ( headers[ 'Content-Length' ] > maxSize ) {
				_reject( { message: 'exceeded_max_size' } );
				return;
			}

			fetchMedia();
		} );
	} );
};

Undocumented.prototype.getAtomicSiteMediaViaProxyRetry = function (
	siteIdOrSlug,
	mediaPath,
	options
) {
	let retries = 0;
	const request = () =>
		this.getAtomicSiteMediaViaProxy( siteIdOrSlug, mediaPath, options ).catch( ( error ) => {
			// Retry three times with exponential backoff times
			if ( retries < 3 ) {
				return new Promise( ( resolve ) => {
					++retries;
					setTimeout( () => {
						resolve( request() );
					}, ( retries * retries * 1000 ) / 2 );
				} );
			}

			return Promise.reject( error );
		} );

	return request();
};

/**
 * Look for a site belonging to the currently logged in user that matches the
 * anchor parameters specified.
 *
 * @param anchorFmPodcastId {string | null}  Example: 22b6608
 * @param anchorFmEpisodeId {string | null}  Example: e324a06c-3148-43a4-85d8-34c0d8222138
 * @param anchorFmSpotifyUrl {string | null} Example: https%3A%2F%2Fopen.spotify.com%2Fshow%2F6HTZdaDHjqXKDE4acYffoD%3Fsi%3DEVfDYETjQCu7pasVG5D73Q
 * @param anchorFmSite {string | null} Example: 181129564
 * @param anchorFmPost {string | null} Example: 5
 * @returns {Promise} A promise
 *    The promise should resolve to a json object containing ".location" key as {string|false} type.
 *    False - There were no matching sites detected, the user should create a new one.
 *    String - The URL to redirect the user to, to edit a new or existing post on that site.
 */
Undocumented.prototype.getMatchingAnchorSite = function (
	anchorFmPodcastId,
	anchorFmEpisodeId,
	anchorFmSpotifyUrl,
	anchorFmSite,
	anchorFmPost
) {
	const queryParts = {
		podcast: anchorFmPodcastId,
		episode: anchorFmEpisodeId,
		spotify_url: anchorFmSpotifyUrl,
		site: anchorFmSite,
		post: anchorFmPost,
	};
	Object.keys( queryParts ).forEach( ( k ) => {
		if ( queryParts[ k ] === null ) {
			delete queryParts[ k ];
		}
	} );
	return this.wpcom.req.get(
		{
			path: '/anchor',
			method: 'GET',
			apiNamespace: 'wpcom/v2',
		},
		queryParts
	);
};

export default Undocumented;

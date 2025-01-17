import { camelOrSnakeSlug } from './camel-or-snake-slug';
import { TITAN_MAIL_MONTHLY_SLUG } from './constants';
import type { WithCamelCaseSlug, WithSnakeCaseSlug } from './types';

export function isTitanMail( product: WithCamelCaseSlug | WithSnakeCaseSlug ): boolean {
	return camelOrSnakeSlug( product ) === TITAN_MAIL_MONTHLY_SLUG;
}

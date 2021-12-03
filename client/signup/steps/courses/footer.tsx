import { Button } from '@automattic/components';
import { useTranslate } from 'i18n-calypso';
import React, { useEffect } from 'react';

interface Props {
	isCourseComplete?: boolean;
	onCourseComplete: () => void;
	onStartWriting: () => void;
}

const CoursesFooter: React.FC< Props > = ( {
	isCourseComplete,
	onCourseComplete,
	onStartWriting,
} ) => {
	const translate = useTranslate();

	useEffect( () => {
		if ( isCourseComplete ) {
			onCourseComplete();
		}
	}, [ isCourseComplete, onCourseComplete ] );

	if ( ! isCourseComplete ) {
		return null;
	}

	return (
		<div className="courses__footer">
			<div className="courses__footer-content">
				{ translate(
					"You did it! Now it's time to put your skills to work and draft your first post."
				) }
				<Button className="courses__footer-button" onClick={ onStartWriting }>
					{ translate( 'Start writing' ) }
				</Button>
			</div>
		</div>
	);
};

export default CoursesFooter;

import type { PostType } from '../types';
import styled from 'styled-components';
import { media } from '../styles/theme/breakpoints';

interface Props {
    post?: PostType;
    className?: string;
    isMobile?: boolean;
}

const DisplayedPostElement : React.FC<Props> = (props : Props) => {
    const { post, className } = props;
    if (post) {
        return ( 
            <div>
                <div className={className}>
                    <img src={post?.url ?? ''} alt=''/>
                </div>
            </div>
        );
    } else {
        return (
            <h1>No Post :(</h1>
        );
    };
};

export const DisplayedPost = styled(DisplayedPostElement)`
    flex: 1 1 auto;
    align-self: auto;
    background-color: #1F3C67;

    padding: 25px;
    margin: 20px 75px 0px 75px;

    border-radius: 20px;
    
    img {
        margin-bottom: 20px;
    }

    ${media.xl} {
        margin: 20px 40px 0px 40px;
        padding: 20px;
    }

    ${media.lg} {
        margin: 15px 20px 0px 20px;
        padding: 15px;
    }

    ${media.md} {
        margin: 10px 10px 0px 10px;
        padding: 10px;
    }
`;

/**
 * Mobile-specific fullscreen version of DisplayedPost.
 * Takes up the entire viewport with the image centered.
 */
export const MobileDisplayedPost = styled(DisplayedPostElement)`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: black;
    padding: 0;
    margin: 0;
    border-radius: 0;
    z-index: 1;
    
    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        margin: 0;
    }
`;

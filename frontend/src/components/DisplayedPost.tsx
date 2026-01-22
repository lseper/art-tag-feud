import type { PostType } from '../types';
import styles from '@/styles/components/displayed-post.module.css';

interface Props {
    post?: PostType;
    className?: string;
    isMobile?: boolean;
    onImageLoad?: (width: number, height: number) => void;
}

const DisplayedPostElement : React.FC<Props> = (props : Props) => {
    const { post, className, onImageLoad } = props;
    console.log(post?.url)
    if (post) {
        return ( 
            <div className={className}>
                <img
                    src={post?.url ?? ''}
                    alt=''
                    onLoad={(event) => {
                        const img = event.currentTarget;
                        onImageLoad?.(img.naturalWidth, img.naturalHeight);
                    }}
                />
            </div>
        );
    } else {
        return (
            <h1>No Post :(</h1>
        );
    };
};

export const DisplayedPost: React.FC<Props> = (props) => (
  <DisplayedPostElement {...props} className={styles.container} />
);

/**
 * Mobile-specific fullscreen version of DisplayedPost.
 * Takes up the entire viewport with the image centered.
 */
export const MobileDisplayedPost: React.FC<Props> = (props) => (
  <DisplayedPostElement {...props} className={styles.mobileContainer} />
);

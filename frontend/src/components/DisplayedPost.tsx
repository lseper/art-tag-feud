import type { PostType } from '../types';
import styled from 'styled-components';

interface Props {
    post?: PostType;
    className?: string;
}

const DisplayedPostElement : React.FC<Props> = (props : Props) => {
    const { post, className } = props;
    if (post) {
        return ( 
            <div>
                <div className={className}>
                    <img style={{marginBottom: "20px"}} src={post?.url ?? ''} alt=''/>
                    <br />
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

    @media (max-width: 768px) {
        width: 100%;
        padding: 5px;
        margin: 0;
    }
`

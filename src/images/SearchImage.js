import React from 'react';
import SvgImage from './SvgImage';

function SearchImage(props) {
    return (
        <SvgImage width="24" height="24" viewBox="0 0 24 24" {...props} svgInternals={`
            <g id="search">
                <path id="magnifying-glass" d="M18.87 18.375l-3.987-3.99-.286-.17a5.774 5.774 0 0 0 1.082-3.372C15.67 7.616 13.06 5 9.84 5A5.843 5.843 0 0 0 4 10.844a5.84 5.84 0 0 0 5.842 5.842c1.26 0 2.423-.403 3.377-1.08l.16.286 3.99 3.987c.32.31.91.24 1.33-.18.41-.42.49-1.01.17-1.33zM9.837 14.56a3.72 3.72 0 0 1-3.718-3.717c0-2.05 1.67-3.72 3.72-3.72s3.72 1.668 3.72 3.72a3.722 3.722 0 0 1-3.72 3.718z"/>
            </g>`} />
    );
}

export default SearchImage;

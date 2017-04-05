import React from "react";
import "whatwg-fetch";
import Modal from "react-modal";
import {I18nProvider, I18nText} from "./I18n";
import Disclaimer from "./Disclaimer";
import Title from "./Title";
import Input from "./Input";
import Recommendations from "./Recommendations";
import StatusMessage from "./StatusMessage";
import CustomMenu from "./CustomMenu";
import Preview from "./Preview";
import {checkStatus, parseJSON, encodeParams} from './util';
import "./Modal.css";

const TYPES = {
    /**
     * Each recommendation type should have an object here
     * with values describing it of the form:
     *
     * <type name>: {
     *     appTitle: <i18n key (or a raw value) for the app to take when this type is selected>,
     *     i18nKey: <i18n key for the recommendation type itself>,
     *     endpoint: <endpoint for the recommendation type>,
     *     specPath: <path, starting at the endpoint, to get the swagger spec>,
     *     queryPath: <path, starting at the endpoint, to send requests to get recommendations from>,
     *     motivation: <function that takes an item and returns a motivation value to be placed in
     *                  the footer of the recommendation card>,
     *
     *     ******** the following values are optional ********
     *
     *     restrictInput: <Array of values that will be used by Input to generate input fields;
     *                     only input params that are present in both the spec and this array will
     *                     be presented to the user>,
     *     urlParamsBuilder: <function that takes the params generated from Input and can make
     *                        modifications before they are used to query for recommendations>,
     *     submitOnLoad: <boolean that will submit a query when the type loads if true,
     *                    but defaults to false>,
     *     getPreviewSidebar: <function that returns a sidebar to place next to the article preview>
     * }
     *
     */
    translation: {
        appTitle: 'title-gapfinder',
        i18nKey: 'title-translation',
        endpoint: 'https://recommend.wmflabs.org/types/translation',
        specPath: '/spec',
        queryPath: '/v1/articles',
        urlParamsBuilder: (params) => {
            if (params.hasOwnProperty('seed')) {
                params.search = 'related_articles';
            }
            return encodeParams(params);
        },
        motivation: () => ''
    },
    related_articles: {
        appTitle: 'title-readmore',
        i18nKey: 'title-related-articles',
        endpoint: 'https://recommend-related-articles.wmflabs.org/types/related_articles',
        specPath: '/spec',
        queryPath: '/v1/articles',
        motivation: () => ''
    },
    missing_sections: {
        appTitle: 'title-expand',
        i18nKey: 'title-missing-sections',
        endpoint: 'https://recommend-missing-sections.wmflabs.org/types/missing_sections',
        specPath: '/spec',
        queryPath: '/v1/articles',
        submitOnLoad: true,
        motivation: (item) => {
            return item.sections.length + ' sections to add';
        },
        getPreviewSidebar: (item) => {
            let sidebarItems = [];
            sidebarItems.push({
                label: "title-add-sections",
                value: '',
                header: true
            });
            for (const section of item.sections) {
                const friendlyName = section.charAt(0) + section.slice(1).toLowerCase();
                const url = "https://en.wikipedia.org/w/index.php?" + encodeParams({
                        title: item.title,
                        action: 'edit',
                        section: 'new',
                        preloadtitle: friendlyName
                    });
                sidebarItems.push({
                    label: friendlyName,
                    value: url
                });
            }
            return <CustomMenu
                className="Preview-sidebar"
                items={sidebarItems}
                onSelect={(value) => window.open(value)}
            />;
        }
    }
};

class App extends React.Component {
    constructor(p, c) {
        super(p, c);
        this.state = {
            language: 'en',
            recommendationType: 'missing_sections',
            recommendations: [],
            previewIndex: -1,
            recommendationsSourceLanguage: 'en',
            error: undefined,
            loading: false
        };
    }

    setLanguage(language) {
        this.setState({language: language});
    }

    resetResult() {
        this.setState({
            recommendations: [],
            previewIndex: -1,
            error: undefined,
            loading: false
        });
    }

    setType(newType) {
        this.resetResult();
        this.setState({recommendationType: newType});
    }

    onSubmitInput(values) {
        this.resetResult();
        this.setState({
            recommendationsSourceLanguage: values.hasOwnProperty('source') ? values.source : 'en',
            loading: true
        });
        const type = TYPES[this.state.recommendationType];
        let url = type.endpoint + type.queryPath;
        let encodedParams = type.urlParamsBuilder ? type.urlParamsBuilder(values) : encodeParams(values);
        url += '?' + encodedParams;
        fetch(url)
            .then(checkStatus)
            .then(parseJSON)
            .then(this.setRecommendations.bind(this))
            .catch((ex) => this.setState({error: ex, loading: false}));
    }

    setRecommendations(results) {
        this.setState({recommendations: results, loading: false});
    }

    showPreview(index) {
        this.setState({previewIndex: index});
    }

    render() {
        let result = '';
        if (this.state.loading === true) {
            result = <StatusMessage><I18nText name="status-preparing"/></StatusMessage>;
        } else if (this.state.error !== undefined) {
            result = <StatusMessage>{JSON.stringify(this.state.error)}</StatusMessage>;
        } else {
            result = (
                <div>
                    <Recommendations
                        items={this.state.recommendations}
                        source={this.state.recommendationsSourceLanguage}
                        type={TYPES[this.state.recommendationType]}
                        showPreview={this.showPreview.bind(this)}/>
                    <Modal
                        isOpen={this.state.previewIndex >= 0}
                        onRequestClose={this.showPreview.bind(this, -1)}
                        contentLabel=""
                        className="Modal">
                        <Preview
                            item={this.state.recommendations[this.state.previewIndex]}
                            type={TYPES[this.state.recommendationType]}
                            index={this.state.previewIndex}
                            length={this.state.recommendations.length}
                            source={this.state.recommendationsSourceLanguage}
                            changeIndex={this.showPreview.bind(this)}/>
                    </Modal>
                </div>
            );
        }
        return (
            <I18nProvider language={this.state.language}>
                <Disclaimer />
                <Title title={TYPES[this.state.recommendationType].appTitle}/>
                <Input types={TYPES} type={this.state.recommendationType} onSetType={this.setType.bind(this)}
                       onSubmit={this.onSubmitInput.bind(this)}/>
                {result}
            </I18nProvider>
        )
    }
}

export default App;

import fs from "fs";

const {reviver} = require("./utilities");

const diseaseLookupText = fs.readFileSync("./data/diseaseLookup.json", {encoding: "utf-8"});
const targetLookupText = fs.readFileSync("./data/targetLookup.json", {encoding: "utf-8"});
const ligandLookupText = fs.readFileSync("./data/ligandLookup.json", {encoding: "utf-8"});

const diseaseLookup = JSON.parse(diseaseLookupText, reviver);
const targetLookup = JSON.parse(targetLookupText, reviver);
const ligandLookup = JSON.parse(ligandLookupText, reviver);

const diseaseArray = Array.from(diseaseLookup.values());


exports.handler = async (event: any) => {
    let responseValue = [];
    const params = event.queryStringParameters;

    if (!params) {
        return {
            statusCode: 400,
            body: 'No query provided.'
        };
    }

    if (params.target) {
        responseValue = getAndProcessData(params.target, targetLookup, formatDiseaseEntity);
        addCitations(responseValue);
    } else if (params.disease) {
        responseValue = getAndProcessData(params.disease, diseaseLookup, formatTargetEntity);
        addCitations(responseValue);
    } else if (params.allTargets) {
        responseValue = getAllData(targetLookup, formatDiseaseEntity);
    } else if (params.allDiseases) {
        responseValue = getAllData(diseaseLookup, formatTargetEntity);
    }
    return {
        statusCode: 200,
        body: JSON.stringify(responseValue)
    };
};

function addCitations(responseValue: any[]) {
    responseValue.forEach((resp: any) => {
        if (resp) {
            addCitation(resp);
        }
    });
}

const getAllData = function (lookupTable: any, extractMethod: any): any[] {
    const response: any = [];
    lookupTable.forEach((val: any, key: string) => {
        response.push({
            entity: key,
            predictions: extractPredictions(val, extractMethod, false)
        })
    });
    return response;
}

const getAndProcessData = function (entity: string, lookupTable: any, transform: any): any[] {
    let entities: string | string[] = entity.split(',');
    const response: any = [];
    if (!Array.isArray(entities)) {
        entities = [entities];
    }
    entities.forEach((oneEntity: any) => {
        const rawData = lookupTable.get(oneEntity);
        if (rawData) {
            const val = JSON.parse(JSON.stringify(rawData));
            response.push({predictions: extractPredictions(val, transform)});
        }
    });
    return response;
}

const extractPredictions = function (response: any, predictionFormatFunction: any, includeConfidence = true) : any {
    const predictions: any[] = [];
    response.predictions.forEach((pred: any) => {
        predictions.push(predictionFormatFunction(pred, includeConfidence));
    });
    return predictions;
}

const transformDiseasePredictions = function (response: any): void {
    return response;
}

const transformLigandPredictions = function (response: any): void {
}

function findMeshID(pred: any) {
    for (let disease of diseaseLookup) {
        if (disease[1].source_name === pred.disease) {
            return disease[0];
        }
    }
    console.log(pred.disease);
    return null;
}

function formatTargetEntity(pred: any, includeConfidence = true): any {
    const ret: any = {
        "@type": "Prediction",
        name: "Predicted Kinase",
        value: {
            "@context": "https://schema.org",
            "@type": "Protein",
            name: pred.target
        }
    }
    if (includeConfidence) {
        ret.confidence = {
            "@context": "https://schema.org",
            "@type": "QuantitativeValue",
            value: pred.probability,
            alternateName: 'probability',
            description: 'Measure of the relevance of inhibiting a particular protein kinase for a specific cancer',
            maxValue: 1,
            minValue: 0
        };
    }
    return ret;
}

function formatDiseaseEntity(pred: any, includeConfidence = true): any {
    const mesh_id = findMeshID(pred);
    const ret: any = {
        "@type": "Prediction",
        name: "Predicted Cancer",
        value: {
            "@context": "https://schema.org",
            "@type": "MedicalCondition",
            name: pred.disease,
            alternateName: "MESH:" + mesh_id
        }
    };
    if (includeConfidence) {
        ret.confidence = {
            "@context": "https://schema.org",
            "@type": "QuantitativeValue",
            value: pred.probability,
            alternateName: 'probability',
            description: 'Measure of the relevance of inhibiting a particular protein kinase for a specific cancer',
            maxValue: 1,
            minValue: 0
        }
    }
    return ret;
}

const transformPredictions = function(response: any, formatFunction: any): void {
    let predictions: any = [];
    response.predictions.forEach((pred: any) => {
        predictions.push(formatFunction(pred));
    });
    response.predictions = predictions;
}

const addCitation = function (response: any): void {
    response.citation = {
        '@context': 'http://schema.org',
        '@type': 'ScholarlyArticle',
        name: 'Supervised learning with word embeddings derived from PubMed captures latent knowledge about protein kinases and cancer',
        abstract: 'Inhibiting protein kinases (PKs) that cause cancers has been an important topic in cancer therapy for years. So far, almost 8% of >530 PKs have been targeted by FDA-approved medications, and around 150 protein kinase inhibitors (PKIs) have been tested in clinical trials. We present an approach based on natural language processing and machine learning to investigate the relations between PKs and cancers, predicting PKs whose inhibition would be efficacious to treat a certain cancer. Our approach represents PKs and cancers as semantically meaningful 100-dimensional vectors based on word and concept neighborhoods in PubMed abstracts. We use information about phase I-IV trials in ClinicalTrials.gov to construct a training set for random forest classification. Our results with historical data show that associations between PKs and specific cancers can be predicted years in advance with good accuracy. Our tool can be used to predict the relevance of inhibiting PKs for specific cancers and to support the design of well-focused clinical trials to discover novel PKIs for cancer therapy.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/34888523/',
        author: [
            {'@type': 'Person', name: 'Vida Ravanmehr'},
            {'@type': 'Person', name: 'Hannah Blau'},
            {'@type': 'Person', name: 'Luca Cappelletti'},
            {'@type': 'Person', name: 'Tommaso Fontana'},
            {'@type': 'Person', name: 'Leigh Carmody'},
            {'@type': 'Person', name: 'Ben Coleman'},
            {'@type': 'Person', name: 'Joshy George'},
            {'@type': 'Person', name: 'Justin Reese'},
            {'@type': 'Person', name: 'Marcin Joachimiak'},
            {'@type': 'Person', name: 'Giovanni Bocci'},
            {'@type': 'Person', name: 'Peter Hansen'},
            {'@type': 'Person', name: 'Carol Bult'},
            {'@type': 'Person', name: 'Jens Rueter'},
            {'@type': 'Person', name: 'Elena Casiraghi'},
            {'@type': 'Person', name: 'Giorgio Valentini'},
            {'@type': 'Person', name: 'Christopher Mungall'},
            {'@type': 'Person', name: 'Tudor I Oprea'},
            {'@type': 'Person', name: 'Peter N Robinson'},
        ],
        datePublished: '2021 Dec 8',
        publisher: {
            '@type': 'Organization',
            name: 'NAR Genomics and Bioinformatics',
            url: 'https://academic.oup.com/nargab'
        },
        creditText: 'Ravanmehr et al.'
    }
}
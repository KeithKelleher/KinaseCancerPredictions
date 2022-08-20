import fs from "fs";
require('typescript-require');
const { parseCSV, replacer } = require("./utilities");
const { XMLParser} = require("fast-xml-parser");

const meshXML = fs.readFileSync("../KinaseCancerPredictionsDevData/desc2022.xml", {encoding:"utf-8"});
const meshJSON = new XMLParser().parse(meshXML);
const meshLookup: any[] = meshJSON.DescriptorRecordSet.DescriptorRecord;

const runit = async () => {
    const activityData = await parseCSV('./data/Supplementary Material File 1.tsv');
    const trialData = await parseCSV('./data/Supplementary Material File 2.tsv');
    const predictionData = await parseCSV('./data/Supplementary Material File 3.tsv');

    const targetLookup: Map<string, {activities: any[], predictions: any[]}> = new Map<string, {activities: any[], predictions: any[]}>();
    const ligandLookup: Map<string, {activities: any[], trials: any[]}> = new Map<string, {activities: any[], trials: any[]}>();
    const diseaseLookup: Map<string, {mesh_id: string, trials: any[], predictions: any[]}> = new Map<string, {mesh_id: string, trials: any[], predictions: any[]}>();

    activityData.forEach((row: any) => {
        const targetData = targetLookup.get(row.PK) || {activities: [], predictions: []};
        targetData.activities.push({
            ligand: row.PKI,
            activitiy: row.ACT_VALUE,
            reference: row.PMID
        })
        targetLookup.set(row.PK, targetData);

        const ligandData = ligandLookup.get(row.PKI) || {activities: [], trials: []};
        ligandData.activities.push({
            target: row.PK,
            activitiy: row.ACT_VALUE,
            reference: row.PMID
        })
        ligandLookup.set(row.PKI, ligandData);
    });

    trialData.forEach((row: any) => {
        const ligandData = ligandLookup.get(row.drug) || {activities: [], trials: []};
        ligandData.trials.push({
            disease: row.disease,
            mesh_id: row.mesh_id,
            phase: row.phase,
            start_date: row.start_date,
            completion_date: row.completion_date,
            nct_id: row.nct_id
        })
        ligandLookup.set(row.drug, ligandData);

        const diseaseData = diseaseLookup.get(row.disease) || {mesh_id: '', trials: [], predictions: []};
        diseaseData.trials.push({
            ligand: row.drug,
            mesh_id: row.mesh_id,
            phase: row.phase,
            start_date: row.start_date,
            completion_date: row.completion_date,
            nct_id: row.nct_id
        });
        diseaseLookup.set(row.disease, diseaseData);
    })

    predictionData.forEach((row: any) => {
        const targetData = targetLookup.get(row.gene_symbol) || {activities: [], predictions: []};
        targetData.predictions.push(
            {
                disease: row.cancer,
                probability: row.probability
            });
        targetLookup.set(row.gene_symbol, targetData);

        const diseaseData = diseaseLookup.get(row.cancer) || {mesh_id: '', trials: [], predictions: []};
        diseaseData.predictions.push(
            {
                target: row.gene_symbol,
                probability: row.probability
            });
        diseaseLookup.set(row.cancer, diseaseData);
    });

    diseaseLookup.forEach((diseaseData, disease) => {
        const meshData = meshLookup.find(term => term.DescriptorName.String === disease);
        if (meshData) {
            diseaseData.mesh_id = meshData.DescriptorUI;
        } else {
            console.log('cant find ' + disease);
        }
    });

    const finalDiseaseLookup: Map<string, {source_name: string, trials: any[], predictions: any[]}> =
        new Map<string, {source_name: string, trials: any[], predictions: any[]}>();

    diseaseLookup.forEach((diseaseData, disease) => {
        finalDiseaseLookup.set(diseaseData.mesh_id, {...diseaseData, source_name: disease});
    });

    fs.writeFileSync('./data/diseaseLookup.json', JSON.stringify(finalDiseaseLookup, replacer));
    fs.writeFileSync('./data/targetLookup.json', JSON.stringify(targetLookup, replacer));
    fs.writeFileSync('./data/ligandLookup.json', JSON.stringify(ligandLookup, replacer));
    console.log('done');
}

runit();
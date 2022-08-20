const fs = require("fs");
import { parse } from 'csv-parse/sync';

exports.parseCSV = async (path: string) => {
    const options: any = {
        columns: true,
        skip_empty_lines: true
    };
    if(path.endsWith('.tsv')){
        options.delimiter = '\t';
    }
    const data = fs.readFileSync(path, {encoding:"utf-8"});
    // @ts-ignore
    return parse(data, options);
}

exports.replacer = (key: any, value: any) => {
    if (value instanceof Map) {
        return {
            _type: "map",
            map: [...value],
        }
    } else return value;
}

exports.reviver = (key: any, value: any) => {
    if (value._type == "map") return new Map(value.map);
    else return value;
}
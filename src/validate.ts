import Ajv from 'ajv';
import addFormats from 'ajv-formats';
const ajv = new Ajv({removeAdditional: 'all', strict: false});
addFormats(ajv);
ajv.addFormat("integer", /^[0-9]*$/)
ajv.addFormat("datetime", /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9]) (2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?$/)
const validate = async (schema: object, data: any) => {
    try {
        const validator = ajv.compile(schema);
        const valid = await validator(data);
        if (!valid)
            return ajv.errorsText(validator.errors);
        return true;
    } catch (err) {
        return err.message;
    }
}

export {validate};
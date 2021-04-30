import { assert } from 'chai';

export async function checkError(promise, type, message) {
    try {
        await promise;
        assert.fail();
    } catch (error) {
        assert.equal(error.name, type, error.toString());
        assert.match(error.message, new RegExp(message), error.toString());
    }
}

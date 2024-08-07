import { RequestArguments } from '../core/provider/interface';
import { Chain } from '../core/type';
export declare function fetchRPCRequest(request: RequestArguments, chain?: Chain): Promise<any>;
/**
 * Validates the arguments for an invalid request and returns an error if any validation fails.
 * Valid request args are defined here: https://eips.ethereum.org/EIPS/eip-1193#request
 * @param args The request arguments to validate.
 * @returns An error object if the arguments are invalid, otherwise undefined.
 */
export declare function checkErrorForInvalidRequestArgs(args: unknown): void;

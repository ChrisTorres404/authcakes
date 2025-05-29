import { Type } from '@nestjs/common';
export declare const ApiResponseWithData: <TModel extends Type<unknown>>(model: TModel) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponseWithData = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_response_dto_1 = require("../../modules/tenants/dto/api-response.dto");
const ApiResponseWithData = (model) => {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiExtraModels)(model), (0, swagger_1.ApiOkResponse)({
        schema: {
            allOf: [
                {
                    $ref: (0, swagger_1.getSchemaPath)(api_response_dto_1.ApiResponseDto),
                },
                {
                    properties: {
                        data: { $ref: (0, swagger_1.getSchemaPath)(model) },
                    },
                },
            ],
        },
    }));
};
exports.ApiResponseWithData = ApiResponseWithData;
//# sourceMappingURL=swagger-generic-response.decorator.js.map
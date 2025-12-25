import { Get, Controller, Req, Res } from "@nestjs/common";
import { importantDatesDTO } from "../dtos/importantDatesDTOS";
import { importantDatesServices } from "../services/importantDatesService";
import { Auth } from "src/common/decorators/auth.decorator";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";

@Controller("/important-dates")
export class ImportanteDatesController {

    constructor(
        private importantDates: importantDatesServices,
    ){}
    
    @Get("/")
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({
        summary: "Get important dates for the authenticated user",
        description: "Retrieves a list of important dates based on the user's university and institute affiliation.",
    })
    //@ts-ignore
    getImportantDates(@Req req, @Res res): Promise<importantDatesDTO[]> {
        const {user} = req;
        return this.importantDates.listImportantDates(user.id);
    }
}



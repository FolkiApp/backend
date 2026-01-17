import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { AbsenceRepository } from '../repositories/absence.repository';
import { UserAbsence } from '../entities/absence.entity';
import { NotFoundAbsences } from '../exceptions/absence-not-found.exception';
import { AbsenceInternalErrorException } from '../exceptions/absence-internal-error.exception';
import { AbsenceUnauthorized } from '../exceptions/absence-unauthorized.exception';

@Injectable()
export class DeleteAbsence {
  private readonly logger = new Logger(DeleteAbsence.name);

  constructor(private readonly absenceRepository: AbsenceRepository) {}

  async execute(user: AuthUser, absenceId: number) {
    this.logger.log({
      message: 'Executing delete absence',
      user,
      absenceId,
    });
    await this.findAbsence(user.id, absenceId);
    await this.deleteAbsence(user.id, absenceId);
  }

  private async deleteAbsence(userId: number, absenceId: number) {
    try {
      await this.absenceRepository.deleteAbsence(userId, absenceId);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error deleting absence',
        absenceId,
        error: error instanceof Error ? error.message : error,
      });
      throw new AbsenceInternalErrorException();
    }
  }

  private async findAbsence(userId: number, absenceId: number) {
    let absence: UserAbsence | null | undefined;
    try {
      absence = await this.absenceRepository.findAbsenceById(userId, absenceId);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error fetching absence',
        absenceId,
        error: error instanceof Error ? error.message : error,
      });
      throw new AbsenceInternalErrorException();
    }
    if (!absence) {
      throw new NotFoundAbsences();
    }
    if (absence.userId != userId) {
      throw new AbsenceUnauthorized();
    }
  }
}

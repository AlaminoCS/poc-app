import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthUser, CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateHabitDto, UpdateHabitDto } from "./dto/habit.dto";
import { HabitsService } from "./habits.service";

@Controller("habits")
@UseGuards(JwtAuthGuard)
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.habitsService.list(user.id);
  }

  @Get("summary")
  summary(
    @CurrentUser() user: AuthUser,
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    return this.habitsService.summary(user.id, from, to);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateHabitDto) {
    return this.habitsService.create(user.id, body);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: UpdateHabitDto,
  ) {
    return this.habitsService.update(user.id, id, body);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.habitsService.remove(user.id, id);
  }

  @Post(":id/toggle-today")
  toggleToday(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.habitsService.toggleToday(user.id, id);
  }
}

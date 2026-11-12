import { Injectable } from "@nestjs/common";
import { createHash } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  accept(input: {
    policyVersion: string;
    anonymousId?: string;
    userId?: string;
    ip?: string;
  }) {
    const ipHash = input.ip
      ? createHash("sha256").update(input.ip).digest("hex").slice(0, 32)
      : null;
    return this.prisma.consentEvent.create({
      data: {
        policyVersion: input.policyVersion,
        anonymousId: input.anonymousId,
        userId: input.userId,
        ipHash,
      },
    });
  }
}

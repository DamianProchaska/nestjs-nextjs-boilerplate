import { InputType, Field } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';

@InputType()
export class PasswordlessLoginInput {
  @Field()
  @IsEmail()
  email: string;
}
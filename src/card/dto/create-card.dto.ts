import { IsString, IsEnum, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH'], {
    message: 'Valid priority required',
  })
  @IsNotEmpty()
  priority: 'LOW' | 'MEDIUM' | 'HIGH';

  @IsEnum(['TODO', 'DONE'], {
    message: 'Valid status required',
  })
  @IsOptional()
  status?: 'TODO' | 'DONE';

  @IsDateString()
  @IsOptional()
  deadline?: string;
}
